import bcrypt from "bcryptjs";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === 'POST' && url.pathname === '/api/signup') {
      const body = await req.json();
      const { full_name, roll_no, room_no, hostel_no, profile_pic_url, password, email, mobile_no } = body;

      if (!full_name || !roll_no || !room_no || !hostel_no || !password || !email || !mobile_no) {
        return new Response(JSON.stringify({ error: 'Missing required field' }), { status: 400 });
      }

      const password_hash = await bcrypt.hash(password, 10);

      try {
        const stmt = env.hostel.prepare(`
          INSERT INTO students 
            (full_name, roll_no, room_no, hostel_no, profile_pic_url, password_hash, email, mobile_no)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.bind(full_name, roll_no, room_no, hostel_no, profile_pic_url || null, password_hash, email, mobile_no).run();

        return new Response(JSON.stringify({ success: true }), { status: 201 });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }

    }

    return new Response("Not Found", { status: 404 });
  }
};
