# External Integrations Setup

This guide covers setting up external service integrations for VERA, including Dropbox for file synchronization and other third-party services.

## Environment Configuration

Before setting up integrations, ensure you have the proper environment file:

1. **Copy the example environment file**

   ```bash
   cp .env.example .env
   ```

2. **Review required variables**
   - The `.env.example` file contains all necessary environment variables
   - Replace placeholder values with your actual service credentials

## Dropbox Integration

VERA can sync research data and files to Dropbox for backup and sharing purposes.

### Creating a Dropbox App

1. **Create a Dropbox Developer Account**

   - Go to [https://www.dropbox.com/developers](https://www.dropbox.com/developers)
   - Sign in with your Dropbox account or create a new one

2. **Create a New App**

   - Click **"Create apps"**
   - Choose the following options:
     - **API**: Scoped access
     - **Type of access**: App folder
     - **App name**: Choose a descriptive name (e.g., "VERA-Research-Sync")

3. **Configure App Settings**
   - After creation, you'll be redirected to the app settings page
   - Note the **App key** and **App secret** - you'll need these for your `.env` file

### Setting Up Permissions

1. **Navigate to Permissions Tab**

   - In your Dropbox app settings, click the **"Permissions"** tab

2. **Enable Required Permissions**

   - **`files.content.write`** - Allow VERA to upload files
   - **`files.content.read`** - Allow VERA to read uploaded files
   - **`files.metadata.read`** - Allow VERA to read file metadata

3. **Submit for Approval** (if required)
   - Click **"Submit"** to apply permission changes

### Generating Access Tokens

1. **Generate Access Token**

   - In the **Settings** tab, scroll to **"OAuth 2"** section
   - Click **"Generate access token"**
   - Copy the generated token (starts with `sl.` typically)

2. **Enable Additional Users** (for team access)
   - In the **Settings** tab, find **"Development users"**
   - Click **"Enable additional users"**
   - Add team members' Dropbox emails as needed

### Environment Configuration

Update your `.env` file with the Dropbox credentials:

```bash
# Dropbox Integration
DROPBOX_CLIENT_ID=your_app_key_here
DROPBOX_CLIENT_SECRET=your_app_secret_here
DROPBOX_ACCESS_TOKEN=your_generated_access_token_here
```

### Testing Dropbox Integration

1. **Verify Configuration**

   ```bash
   # Restart the development environment to load new env vars
   docker-compose -f docker-compose.dev.yml down
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Test File Upload**
   - Use the VERA interface to upload a test file
   - Check your Dropbox app folder for the uploaded file
   - Verify file permissions and accessibility

## Database Configuration

### MongoDB Setup

For development, MongoDB runs in a Docker container. For production deployments:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/vera_dev
MONGODB_PROD_URI=mongodb://your-production-host:27017/vera_prod
```

### Database Initialization

```bash
# Run database migrations/setup
docker-compose -f docker-compose.dev.yml exec api npm run db:setup

# Seed development data (if available)
docker-compose -f docker-compose.dev.yml exec api npm run db:seed
```

## Authentication Services

### JWT Configuration

```bash
# JWT Settings
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=24h
```

**Security Note**: Use a strong, unique JWT secret in production. Generate with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Session Configuration

```bash
# Session Settings
SESSION_SECRET=your_secure_session_secret_here
SESSION_COOKIE_SECURE=false  # Set to true in production with HTTPS
```

## Email Services (Optional)

If VERA includes email functionality for notifications or user verification:

### SMTP Configuration

```bash
# Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@your-domain.com
```

### Email Service Setup (Gmail Example)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "VERA Application"
3. **Use the app password** as `SMTP_PASS` in your `.env` file

## API Keys and External Services

### Research-Specific Integrations

Depending on your research requirements, you may need:

```bash
# Biometric Device APIs (example)
BIOSIGNAL_API_KEY=your_biosignal_service_key
BIOSIGNAL_API_URL=https://api.biosignal-service.com

# VR Platform Integration (example)
VR_PLATFORM_API_KEY=your_vr_platform_key
VR_PLATFORM_WEBHOOK_SECRET=your_webhook_secret

# Analytics Services (example)
ANALYTICS_API_KEY=your_analytics_key
```

## Environment-Specific Configuration

### Development Environment

```bash
# Development Settings
NODE_ENV=development
DEBUG=vera:*
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
```

### Production Environment

```bash
# Production Settings
NODE_ENV=production
DEBUG=vera:error
LOG_LEVEL=error
CORS_ORIGIN=https://your-production-domain.com
```

## Security Best Practices

### Environment Variable Security

1. **Never commit `.env` files** to version control
2. **Use different credentials** for each environment (dev, test, prod)
3. **Rotate API keys regularly**, especially after team member changes
4. **Use secrets management** in production (Azure Key Vault, AWS Secrets Manager, etc.)

### Access Control

1. **Limit Dropbox app permissions** to only what's necessary
2. **Use scoped API keys** where possible
3. **Implement proper user roles** in VERA for data access
4. **Regular audit** of external service access logs

## Troubleshooting

### Dropbox Issues

**Upload Failures**

- Verify `files.content.write` permission is enabled
- Check access token hasn't expired
- Ensure file size is within Dropbox limits

**Authentication Errors**

- Confirm `DROPBOX_CLIENT_ID` and `DROPBOX_CLIENT_SECRET` are correct
- Verify access token is valid and not revoked
- Check app status in Dropbox developer console

### Database Connection Issues

**Connection Refused**

- Ensure MongoDB container is running: `docker-compose ps`
- Check MongoDB logs: `docker-compose logs mongo`
- Verify `MONGODB_URI` format is correct

### Email Service Issues

**SMTP Authentication Failed**

- Verify SMTP credentials are correct
- For Gmail, ensure app password is used (not account password)
- Check SMTP server settings for your email provider

## Testing Integrations

```bash
# Test Dropbox integration
docker-compose -f docker-compose.dev.yml exec api npm run test:integration:dropbox

# Test database connection
docker-compose -f docker-compose.dev.yml exec api npm run test:db

# Test email service
docker-compose -f docker-compose.dev.yml exec api npm run test:email
```

## Next Steps

After configuring integrations:

1. **Test all services** in development environment
2. **Document any custom integrations** for your research needs
3. **Set up monitoring** for external service health
4. **Plan backup strategies** for critical data flows
