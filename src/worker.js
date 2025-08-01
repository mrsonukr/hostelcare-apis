import bcrypt from 'bcryptjs';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Add CORS headers for all responses
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: corsHeaders,
			});
		}

		// Handle signup endpoint
		if (request.method === 'POST' && url.pathname === '/api/signup') {
			try {
				const body = await request.json();
				const { roll_no, mobile_no, password, email } = body;

				// Validate required fields
				if (!roll_no || !mobile_no || !password || !email) {
					return new Response(
						JSON.stringify({ 
							error: 'Missing required fields',
							required: ['roll_no', 'mobile_no', 'password', 'email']
						}),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				}

				// Check if roll number exists in KV store with "student:" prefix
				const kvKey = `student:${roll_no}`;
				const kvStudentData = await env.student_data.get(kvKey);
				
				if (!kvStudentData) {
					// Try to list some keys to debug
					try {
						const listResult = await env.student_data.list({ prefix: 'student:', limit: 5 });
						console.log('Available keys sample:', listResult.keys.map(k => k.name));
					} catch (listError) {
						console.error('Error listing KV keys:', listError);
					}
					
					console.error(`Roll number ${roll_no} not found in student_data namespace at key ${kvKey}`);
					return new Response(
						JSON.stringify({ 
							error: 'Roll number not found in student database',
							message: 'Please contact administration to verify your roll number',
							roll_no: roll_no,
							debug: {
								kvKey: kvKey,
								hasKVBinding: !!env.student_data
							}
						}),
						{
							status: 404,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				}

				// Parse KV data and get student details
				const kvData = JSON.parse(kvStudentData);
				const registeredName = kvData.name || kvData.full_name;
				const registeredGender = kvData.gender;

				// Validate that KV data contains required fields
				if (!registeredName || !registeredGender) {
					return new Response(
						JSON.stringify({ 
							error: 'Invalid student data in database',
							message: 'Student record missing name or gender',
							roll_no: roll_no
						}),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				}

				// Hash the password
				const password_hash = await bcrypt.hash(password, 10);

				// Insert into database
				const stmt = env.hostel.prepare(`
					INSERT INTO students 
						(roll_no, full_name, mobile_no, password_hash, gender, email_verified, email)
					VALUES (?, ?, ?, ?, ?, ?, ?)
				`);

				const result = await stmt
					.bind(roll_no, registeredName, mobile_no, password_hash, registeredGender, false, email)
					.run();

				if (result.success) {
					return new Response(
						JSON.stringify({ 
							success: true, 
							message: 'Student registered successfully',
							roll_no: roll_no,
							full_name: registeredName,
							gender: registeredGender,
							email: email
						}),
						{
							status: 201,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				} else {
					throw new Error('Failed to insert student record');
				}
			} catch (error) {
				console.error('Signup error:', error);
				
				// Handle specific database errors
				let errorMessage = 'Internal server error';
				let statusCode = 500;

				if (error.message.includes('UNIQUE constraint failed')) {
					if (error.message.includes('roll_no')) {
						errorMessage = 'Roll number already exists';
					} else if (error.message.includes('mobile_no')) {
						errorMessage = 'Mobile number already exists';
					} else if (error.message.includes('email')) {
						errorMessage = 'Email already exists';
					} else {
						errorMessage = 'Duplicate entry found';
					}
					statusCode = 409;
				} else if (error.message.includes('D1_ERROR')) {
					errorMessage = `Database error: ${error.message}`;
					statusCode = 500;
				}

				return new Response(
					JSON.stringify({ error: errorMessage }),
					{
						status: statusCode,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					}
				);
			}
		}

		// Handle login endpoint
		if (request.method === 'POST' && url.pathname === '/api/login') {
			try {
				const body = await request.json();
				const { username, password } = body;

				if (!username || !password) {
					return new Response(
						JSON.stringify({ 
							error: 'Username and password are required',
							note: 'Username can be roll number or mobile number'
						}),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				}

				// Find user by roll_no or mobile_no
				const stmt = env.hostel.prepare('SELECT * FROM students WHERE roll_no = ? OR mobile_no = ?');
				const result = await stmt.bind(username, username).first();

				if (!result) {
					return new Response(
						JSON.stringify({ error: 'Invalid credentials' }),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				}

				// Verify password
				const isValidPassword = await bcrypt.compare(password, result.password_hash);

				if (!isValidPassword) {
					return new Response(
						JSON.stringify({ error: 'Invalid credentials' }),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				}

				// Remove password hash from response
				const { password_hash, ...studentData } = result;

				return new Response(
					JSON.stringify({
						success: true,
						message: 'Login successful',
						student: studentData,
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					}
				);
			} catch (error) {
				console.error('Login error:', error);
				return new Response(
					JSON.stringify({ error: 'Internal server error' }),
					{
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					}
				);
			}
		}

		// Handle get student profile endpoint by roll number
		if (request.method === 'GET' && url.pathname.startsWith('/api/student/')) {
			try {
				const rollNo = url.pathname.split('/').pop();

				if (!rollNo || rollNo.length !== 8 || isNaN(rollNo)) {
					return new Response(
						JSON.stringify({ 
							error: 'Invalid roll number format. Must be exactly 8 digits',
							example: '11232763'
						}),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				}

				const stmt = env.hostel.prepare('SELECT roll_no, full_name, gender, room_no, hostel_no, profile_pic_url, email, mobile_no, email_verified, created_at FROM students WHERE roll_no = ?');
				const result = await stmt.bind(rollNo).first();

				if (!result) {
					return new Response(
						JSON.stringify({ error: 'Student not found' }),
						{
							status: 404,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				}

				return new Response(
					JSON.stringify({
						success: true,
						student: result,
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					}
				);
			} catch (error) {
				console.error('Get student error:', error);
				return new Response(
					JSON.stringify({ error: 'Internal server error' }),
					{
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					}
				);
			}
		}

		// Handle update student profile endpoint by roll number
		if (request.method === 'PUT' && url.pathname.startsWith('/api/student/')) {
			try {
				const rollNo = url.pathname.split('/').pop();

				if (!rollNo || rollNo.length !== 8 || isNaN(rollNo)) {
					return new Response(
						JSON.stringify({ 
							error: 'Invalid roll number format. Must be exactly 8 digits',
							example: '11232763'
						}),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				}

				// Check if student exists
				const checkStmt = env.hostel.prepare('SELECT roll_no FROM students WHERE roll_no = ?');
				const studentExists = await checkStmt.bind(rollNo).first();

				if (!studentExists) {
					return new Response(
						JSON.stringify({ error: 'Student not found' }),
						{
							status: 404,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				}

				const body = await request.json();
				const allowedFields = ['full_name', 'gender', 'room_no', 'hostel_no', 'profile_pic_url', 'email', 'mobile_no', 'email_verified'];
				const updateFields = Object.keys(body).filter(key => allowedFields.includes(key));

				if (updateFields.length === 0) {
					return new Response(
						JSON.stringify({ 
							error: 'No valid fields provided for update',
							allowed: allowedFields
						}),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				}

				// Build dynamic SQL query
				const setClause = updateFields.map(field => `${field} = ?`).join(', ');
				const query = `UPDATE students SET ${setClause} WHERE roll_no = ?`;
				const stmt = env.hostel.prepare(query);

				// Bind values in the order of updateFields plus rollNo
				const values = updateFields.map(field => body[field] === undefined ? null : body[field]);
				values.push(rollNo);

				const result = await stmt.bind(...values).run();

				if (result.success) {
					// Fetch updated record
					const updatedStmt = env.hostel.prepare('SELECT roll_no, full_name, gender, room_no, hostel_no, profile_pic_url, email, mobile_no, email_verified, created_at FROM students WHERE roll_no = ?');
					const updatedStudent = await updatedStmt.bind(rollNo).first();

					return new Response(
						JSON.stringify({ 
							success: true, 
							message: 'Student profile updated successfully',
							roll_no: rollNo,
							updated_fields: updateFields,
							student: updatedStudent
						}),
						{
							status: 200,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						}
					);
				} else {
					throw new Error('Failed to update student record');
				}
			} catch (error) {
				console.error('Update student error:', error);
				
				// Handle specific database errors
				let errorMessage = 'Internal server error';
				let statusCode = 500;

				if (error.message.includes('UNIQUE constraint failed')) {
					if (error.message.includes('email')) {
						errorMessage = 'Email already exists';
					} else if (error.message.includes('mobile_no')) {
						errorMessage = 'Mobile number already exists';
					} else {
						errorMessage = 'Duplicate entry found';
					}
					statusCode = 409;
				} else if (error.message.includes('D1_ERROR')) {
					errorMessage = `Database error: ${error.message}`;
					statusCode = 500;
				}

				return new Response(
					JSON.stringify({ error: errorMessage }),
					{
						status: statusCode,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					}
				);
			}
		}

		// Handle 404 for unknown routes
		return new Response(
			JSON.stringify({ error: 'Route not found' }),
			{
				status: 404,
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			}
		);
	},
};