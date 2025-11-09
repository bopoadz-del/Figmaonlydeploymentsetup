# AWS Deployment Guide

This directory contains the AWS infrastructure and deployment configuration for the Stock Analysis application, migrated from Supabase to AWS.

## Architecture

The application uses the following AWS services:

- **AWS Lambda**: Serverless compute for the API backend (replaces Supabase Edge Functions)
- **Amazon DynamoDB**: NoSQL database for key-value storage (replaces Supabase PostgreSQL)
- **Amazon API Gateway**: HTTP API for exposing Lambda functions
- **AWS SAM (Serverless Application Model)**: Infrastructure as Code for deployment

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```
3. **AWS SAM CLI** installed
   ```bash
   # macOS
   brew install aws-sam-cli

   # Windows (via Chocolatey)
   choco install aws-sam-cli

   # Linux
   pip install aws-sam-cli
   ```
4. **Node.js 20+** installed
5. **Alpha Vantage API Key** (free tier available at https://www.alphavantage.co/support/#api-key)
6. **(Optional) FMP API Key** for enhanced search features

## Directory Structure

```
aws/
├── template.yaml           # AWS SAM CloudFormation template
├── lambda/                 # Lambda function code
│   ├── src/               # TypeScript source code
│   │   ├── index.ts       # Main Lambda handler
│   │   ├── kv_store.ts    # DynamoDB wrapper
│   │   ├── evidence.ts    # Evidence scoring module
│   │   ├── financialScores.ts  # Financial calculations
│   │   └── smartSearch.ts # Smart search functionality
│   ├── package.json       # Lambda dependencies
│   └── tsconfig.json      # TypeScript configuration
├── deploy.sh              # Deployment script
└── README.md              # This file
```

## Deployment Steps

### 1. Build the Lambda Function

Navigate to the `lambda` directory and install dependencies:

```bash
cd lambda
npm install
npm run build
```

This will:
- Install Node.js dependencies
- Compile TypeScript to JavaScript
- Output to `lambda/dist/`

### 2. Deploy with AWS SAM

From the `aws` directory, run:

```bash
# Guided deployment (first time)
sam deploy --guided

# Or use the deployment script
./deploy.sh
```

During guided deployment, you'll be prompted for:

- **Stack Name**: Choose a name (e.g., `stock-analysis-app`)
- **AWS Region**: Select your region (e.g., `us-east-1`)
- **Alpha Vantage Key**: Enter your API key
- **FMP API Key**: (Optional) Enter if you have one
- **Confirm changes**: Review the changeset
- **Save configuration**: Save settings to `samconfig.toml`

### 3. Get the API Endpoint

After deployment, SAM will output the API Gateway endpoint URL:

```
Outputs:
ApiEndpoint: https://abcd1234.execute-api.us-east-1.amazonaws.com/dev/
```

Save this URL - you'll need it for frontend configuration.

### 4. Configure the Frontend

1. Copy `.env.example` to `.env`:
   ```bash
   cd ..  # Back to project root
   cp .env.example .env
   ```

2. Edit `.env` and set:
   ```env
   REACT_APP_USE_AWS=true
   REACT_APP_AWS_API_URL=https://YOUR-API-ID.execute-api.REGION.amazonaws.com/dev/
   REACT_APP_AWS_REGION=us-east-1
   ```

3. Restart your development server:
   ```bash
   npm start
   ```

## Updating the Lambda Function

After making code changes:

```bash
cd aws/lambda
npm run build
cd ..
sam deploy
```

Or use the deployment script:

```bash
cd aws
./deploy.sh
```

## Testing the Deployment

### Health Check

```bash
curl https://YOUR-API-ID.execute-api.REGION.amazonaws.com/dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T...",
  "apiKeyConfigured": true
}
```

### Test Stock Analysis

```bash
curl https://YOUR-API-ID.execute-api.REGION.amazonaws.com/dev/stock/AAPL
```

## Cost Estimates

With AWS Free Tier:

- **Lambda**: 1M free requests/month + 400,000 GB-seconds compute
- **DynamoDB**: 25 GB storage + 25 read/write capacity units
- **API Gateway**: 1M HTTP API calls/month (first 12 months)

**Estimated monthly cost** (after free tier): $0-5 for low to moderate usage

## Monitoring

### CloudWatch Logs

View Lambda logs:
```bash
sam logs --stack-name stock-analysis-app --tail
```

### DynamoDB Metrics

Monitor table metrics in AWS Console:
1. Go to DynamoDB console
2. Select your table (`stock-analysis-app-kv-store`)
3. Click "Metrics" tab

### API Gateway Metrics

View API metrics in AWS Console:
1. Go to API Gateway console
2. Select your HTTP API
3. Click "Monitor" tab

## Troubleshooting

### Lambda Function Errors

```bash
# View recent logs
sam logs --stack-name stock-analysis-app --tail

# View specific error
aws logs filter-log-events \
  --log-group-name /aws/lambda/stock-analysis-app-server \
  --filter-pattern "ERROR"
```

### DynamoDB Access Issues

Verify the Lambda function has DynamoDB permissions:
```bash
aws iam get-role-policy \
  --role-name stock-analysis-app-StockAnalysisFunctionRole-XXX \
  --policy-name DynamoDBCrudPolicy
```

### CORS Issues

If you encounter CORS errors, verify API Gateway CORS configuration in `template.yaml`:
```yaml
CorsConfiguration:
  AllowOrigins:
    - "*"
  AllowHeaders:
    - "*"
  AllowMethods:
    - GET
    - POST
    - DELETE
    - OPTIONS
```

## Cleanup

To delete all AWS resources:

```bash
sam delete --stack-name stock-analysis-app
```

This will remove:
- Lambda function
- API Gateway
- DynamoDB table (⚠️ **WARNING**: This deletes all data!)
- IAM roles
- CloudWatch logs

## Environment Variables

The Lambda function uses these environment variables:

- `DYNAMODB_TABLE`: Auto-configured by CloudFormation
- `ALPHA_VANTAGE_KEY`: Set during deployment
- `FMP_API_KEY`: Optional, for enhanced search
- `NODE_ENV`: Set to `dev` or `prod`

## Security Considerations

1. **API Keys**: Store sensitive keys in AWS Secrets Manager for production
2. **CORS**: Restrict `AllowOrigins` to your domain in production
3. **Rate Limiting**: Consider adding API Gateway throttling
4. **Authentication**: Add API Gateway authorizers for production use

## Migration from Supabase

This AWS deployment maintains API compatibility with the original Supabase implementation:

- All routes remain the same (e.g., `/stock/:symbol`, `/tickers`, etc.)
- Response formats are identical
- The frontend can switch between Supabase and AWS via environment variable

### Key Differences

| Feature | Supabase | AWS |
|---------|----------|-----|
| Runtime | Deno | Node.js 20 |
| Database | PostgreSQL | DynamoDB |
| Auth | Supabase Auth | None (can add API Gateway auth) |
| Deployment | `supabase deploy` | `sam deploy` |

## Next Steps

- [ ] Set up CI/CD pipeline (GitHub Actions, AWS CodePipeline)
- [ ] Add API authentication (API Gateway Authorizers)
- [ ] Configure custom domain name
- [ ] Set up monitoring alerts (CloudWatch Alarms)
- [ ] Implement caching (API Gateway caching or CloudFront)
- [ ] Add WAF rules for security

## Support

For issues or questions:
- AWS SAM Documentation: https://docs.aws.amazon.com/serverless-application-model/
- AWS Lambda Documentation: https://docs.aws.amazon.com/lambda/
- DynamoDB Documentation: https://docs.aws.amazon.com/dynamodb/
