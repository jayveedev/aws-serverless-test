# AWS Serverless Setup Guide

This guide walks you through setting up AWS and the Serverless Framework for deploying Lambda functions with API Gateway endpoints.

## Prerequisites

- Node.js (v18+ recommended)
- AWS Account with IAM user credentials
- npm or yarn package manager

## Step 1: AWS Account Setup

### 1.1 Create an AWS Account

1. Go to [AWS Console](https://aws.amazon.com)
2. Sign up for a new account or sign in to existing account

### 1.2 Create IAM User

1. Navigate to **IAM** service in AWS Console
2. Click **Users** → **Create User**
3. Enter username (e.g., `serverless-user`)
4. Select **Provide user access to the AWS Management Console** if needed
5. Click **Next**

### 1.3 Set Permissions

1. Select **Attach policies directly**
2. Add the following policies:
   - `AWSLambdaFullAccess`
   - `IAMFullAccess`
   - `AmazonAPIGatewayAdministrator`
   - `CloudFormationFullAccess`
   - `AmazonS3FullAccess`
3. Click **Next** → **Create User**

### 1.4 Generate Access Keys

1. Click on the created user
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Select **Command Line Interface (CLI)**
5. Add description and click **Create access key**
6. **Important**: Copy both `Access Key ID` and `Secret Access Key`

## Step 2: Install Serverless Framework Globally

### 2.1 Install Serverless CLI

Install the Serverless Framework CLI globally to use it from anywhere on your system:

```bash
npm install -g serverless@latest
```

### 2.2 Verify Installation

Confirm the installation was successful:

```bash
# Check version
serverless --version

# Or use the short form
sls --version
```

You should see output similar to:

```
Framework Core: 4.4.11
Plugin: 7.2.0
SDK: 4.5.1
```

### 2.3 Available Commands

With serverless installed globally, you can use these commands:

```bash
# Create a new service from template
sls create --template aws-nodejs --path my-service

# Deploy your service
sls deploy

# Invoke a function
sls invoke --function functionName

# View logs
sls logs --function functionName

# Remove deployed service
sls remove
```

## Step 3: Connect to Serverless Account

### 3.1 Create/Login to Serverless Account

The Serverless Framework provides a dashboard for monitoring and managing your serverless applications. Connect your CLI to your account:

```bash
# Login to existing account or create new one
serverless login

# Or use the short form
sls login
```

This will:

1. Open your browser to the Serverless Dashboard
2. Prompt you to sign up for a new account or log into an existing one
3. Automatically authenticate your CLI with your account

### 3.2 Create Organization and App (Optional)

If you want to organize your projects in the Serverless Dashboard:

```bash
# Create a new organization
sls org create --name your-org-name

# Create a new app under your organization
sls app create --name your-app-name --org your-org-name
```

### 3.3 Verify Connection

Check that you're properly authenticated:

```bash
# List your organizations
sls org list

# List your apps
sls app list
```

**Note**: You can also use the Serverless Framework without connecting to an account, but you'll miss out on:

- Deployment monitoring and metrics
- Error tracking and alerting
- Team collaboration features
- CI/CD integration capabilities

## Step 4: Configure AWS Credentials

### Option 1: Environment Variables (Recommended)

```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_DEFAULT_REGION=us-east-1
```

### Option 2: AWS CLI Configuration

```bash
# Install AWS CLI first
npm install -g aws-cli

# Configure credentials
aws configure
```

## Step 5: Project Setup

### 5.1 Initialize Project

```bash
# Create project directory
mkdir my-serverless-project
cd my-serverless-project

# Initialize npm project
npm init -y
```

### 5.2 Install Dependencies

```bash
# Install development dependencies (serverless already installed globally)
npm install --save-dev eslint@^9.14.0 prettier@^3.3.3
npm install --save-dev eslint-config-prettier@^9.1.0 eslint-plugin-prettier@^5.2.1
npm install --save-dev @eslint/js@^9.14.0 globals@^15.11.0
npm install --save-dev cross-env@^10.0.0
npm install --save @serverless/aws-lambda-sdk@^0.15.15
```

### 5.3 Update package.json

Add these scripts to your `package.json`:

```json
{
  "type": "module",
  "scripts": {
    "dev": "cross-env USER=$(whoami) sls dev --stage $USER-dev",
    "deploy:dev": "cross-env USER=$(whoami) && sls deploy --stage $USER-dev",
    "deploy:prod": "sls deploy --stage prod",
    "invoke:local": "sls invoke local --function main",
    "lint": "eslint src/**/*.js",
    "format": "prettier --write src/**/*.js",
    "cross-env": "cross-env"
  }
}
```

**Key Script Features:**

- **User-specific development stages**: Both `dev` and `deploy:dev` use your username to create personalized stages (e.g., `john-dev`)
- **Cross-platform compatibility**: `cross-env` ensures scripts work on Windows, macOS, and Linux
- **Team-friendly workflow**: Multiple developers can work simultaneously without stage conflicts

## Step 6: Serverless Configuration

### 6.1 Create serverless.yml

```yaml
# Replace with your organization and app names from Step 3
# If you didn't create them, you can remove these lines
org: your-org-name
app: your-app-name
service: main

frameworkVersion: '4'

build:
  esbuild:
    bundle: true
    minify: false
    exclude:
      - '@aws-sdk/*'
      - '@serverless/*'
      - 'dynamodb-admin/*'
      - 'eslint/*'
      - 'serverless/*'
      - 'serverless-cloudflare-tunnel/*'
      - 'serverless-dynamodb/*'
      - 'serverless-dynamodb-ttl/*'
      - 'serverless-offline/*'

provider:
  name: aws
  runtime: nodejs20.x
  stage: ${opt:stage, 'dev'}
  region: ${opt:region, 'us-east-1'}
  profile: default
  tracing:
    apiGateway: true
    lambda: true
  environment:
    REGION: ${self:provider.region}
    STAGE: ${self:provider.stage}
    APP: ${self:app}
    SERVICE: ${self:service}
    NODE_NO_WARNINGS: 1
    NODE_OPTIONS: '--enable-source-maps'
    AWS_ACCOUNT_ID: { Ref: 'AWS::AccountId' }
    LAMBDA_URL:
      {
        'Fn::Join':
          [
            '',
            [
              'https://',
              { 'Ref': 'ApiGatewayRestApi' },
              '.execute-api.${self:custom.region}.amazonaws.com/${self:custom.stage}/',
            ],
          ],
      }
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
            - lambda:InvokeFunction
            - iam:PassRole
            - cloudwatch:PutMetricData
          Resource: '*'

functions:
  main:
    handler: src/main.main
    events:
      - http:
          method: get
          path: test
          cors: true

custom:
  stage: ${opt:stage, self:provider.stage}
  region: ${opt:region, self:provider.region}
  serverless-offline:
    httpPort: 3005

package:
  patterns:
    - '!.dynamodb/**'
    - '!.idea/**'
    - '!.vscode/**'
    - '!README.md'
    - '!.eslintrc.json'
  excludeDevDependencies: true
```

**Key Configuration Features:**

- **Build Optimization**: ESBuild bundling with selective exclusions for faster deployments
- **Tracing**: AWS X-Ray tracing enabled for API Gateway and Lambda functions
- **Enhanced Environment Variables**: Includes region, stage, app name, and auto-generated Lambda URL
- **Extended IAM Permissions**: Additional permissions for Lambda invocation, IAM roles, and CloudWatch metrics
- **Development Tools**: Serverless-offline configuration for local development on port 3005
- **Package Optimization**: Excludes development files and dependencies for smaller deployment packages

### 6.2 Create Lambda Function

Create `src/main.js`:

```javascript
export const main = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
    body: JSON.stringify({
      message: 'Hello World from serverless!',
      timestamp: new Date().toISOString(),
      stage: process.env.STAGE || 'dev',
      requestId: context.requestId,
    }),
  };

  return response;
};
```

## Step 7: Development Tools Configuration

### 7.1 Create .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 7.2 Create eslint.config.mjs

```javascript
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
```

## Step 8: Deployment

### 8.1 Development Deployment (User-Specific)

```bash
# Deploy to your personal development stage
npm run deploy:dev
```

This creates a stage named `{your-username}-dev` (e.g., `john-dev`, `alice-dev`) to avoid conflicts with other team members.

### 8.2 Production Deployment

```bash
# Deploy to production stage
npm run deploy:prod
```

### 8.3 Test Deployment

After successful deployment, you'll receive an API Gateway endpoint URL. Test it:

```bash
# For development stage
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/{username}-dev/test

# For production stage
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/test
```

## Step 9: Local Development

### 9.1 Local Testing

```bash
# Test function locally without AWS
npm run invoke:local
```

### 9.2 Development Server

```bash
# Start development server with user-specific staging
npm run dev
```

**Benefits of User-Specific Development:**

- **No conflicts**: Each developer gets their own AWS stage
- **Team-friendly**: Multiple developers can work simultaneously
- **Automatic**: Uses `$(whoami)` to detect username automatically
- **Cross-platform**: Works on Windows, macOS, and Linux (including WSL)

## Step 10: Team Collaboration Setup

### 10.1 Team Workflow

When working in a team:

1. **Development**: Each developer uses `npm run deploy:dev` for their personal stage
2. **Integration**: Use a shared `dev` or `staging` environment for integration testing
3. **Production**: Only deploy to `prod` stage for live releases

### 10.2 Stage Management

Your stages will look like:

- `john-dev` (John's development stage)
- `alice-dev` (Alice's development stage)
- `staging` (shared integration stage)
- `prod` (production stage)

## Project Structure

```
my-serverless-project/
├── src/
│   └── main.js              # Lambda functions
├── eslint.config.mjs        # ESLint configuration
├── .prettierrc              # Prettier configuration
├── package.json             # Dependencies and scripts
├── serverless.yml           # Serverless configuration
└── .gitignore              # Git ignore rules
```

## Essential Commands

```bash
# Install dependencies
npm install

# Deploy to your personal development stage
npm run deploy:dev

# Deploy to production
npm run deploy:prod

# Test locally
npm run invoke:local

# Start development server
npm run dev

# Format code
npm run format

# Lint code
npm run lint
```

## Advanced Features

### Environment-Specific Configuration

You can add stage-specific environment variables in `serverless.yml`:

```yaml
provider:
  environment:
    STAGE: ${self:provider.stage}
    DATABASE_URL: ${self:custom.databaseUrl.${self:provider.stage}}

custom:
  databaseUrl:
    dev: 'database-dev-url'
    prod: 'database-prod-url'
```

### Multiple Functions

Add more functions to `serverless.yml`:

```yaml
functions:
  main:
    handler: src/main.main
    events:
      - http:
          method: get
          path: test

  users:
    handler: src/users.handler
    events:
      - http:
          method: get
          path: users
```

## Key Features

- ✅ **User-specific development stages** for team collaboration
- ✅ **Cross-platform compatibility** with `cross-env`
- ✅ **ES6 Modules support** with `"type": "module"`
- ✅ **Multi-stage deployment** (personal dev + production)
- ✅ **CORS enabled API endpoints**
- ✅ **Automatic logging and error handling**
- ✅ **ESLint and Prettier integration**
- ✅ **Local testing capabilities**

## Next Steps

1. Add more Lambda functions in the `src/` directory
2. Configure additional API Gateway endpoints
3. Set up environment-specific variables
4. Implement database connections
5. Add monitoring and alerting
6. Set up CI/CD pipelines for automated deployments

Your team-ready serverless application is now configured for scalable development and deployment!

## Troubleshooting

### Cross-env Permission Issues (Windows/WSL)

If you encounter permission errors when running scripts that use `cross-env`, such as:

- `cross-env: command not found`
- Permission denied errors
- PowerShell execution policy restrictions

**Solution: Install cross-env globally**

```bash
npm install -g cross-env
```

This resolves cross-platform environment variable issues on Windows and WSL systems by making `cross-env` available globally instead of relying on local node_modules execution.

**Alternative Solutions:**

- Set PowerShell execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Use `npx cross-env` prefix in scripts (may have compatibility issues)
- Switch to WSL or Git Bash for better Unix-like environment support
