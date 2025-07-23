# Hostel API

## Setup Instructions

### 1. Deploy the Worker
```bash
npm run deploy
```

### 2. Populate KV Store with Student Data

You need to populate the KV store with student data. First, get your Cloudflare API token:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Create a new API token with:
   - Zone: Zone:Read
   - Account: Account:Read
   - User: User:Read
   - Zone Resources: Include All zones
   - Account Resources: Include All accounts

3. Set the environment variable and run the populate script:

```bash
export CLOUDFLARE_API_TOKEN="your-api-token-here"
npm run populate-kv
```

### 3. Verify KV Data

You can verify the KV data is populated by checking the Cloudflare dashboard or testing the API.

## API Endpoints

### POST /api/signup
Register a new student

### POST /api/login  
Login with roll number or mobile number

### GET /api/student/{roll_no}
Get student profile

### PUT /api/student/{roll_no}
Update student profile

## Troubleshooting

### "Roll number not found" Error

This happens when:
1. KV store is not populated with student data
2. KV namespace binding is not properly configured
3. The roll number doesn't exist in the student database

**Solution:**
1. Make sure you've run `npm run populate-kv` after deployment
2. Check that the KV namespace ID in `wrangler.toml` matches your Cloudflare dashboard
3. Verify the roll number exists in `migrations/student.json`

### Local vs Production Differences

- Local development uses `.dev.vars` file for environment variables
- Production uses Cloudflare Workers environment
- KV store needs to be populated separately for production

## Environment Variables

The following are automatically available in Cloudflare Workers:
- Database bindings (D1)
- KV namespace bindings
- Account ID and other Cloudflare-specific variables