# Supabase to AWS Migration Guide

This guide explains the complete migration from Supabase to AWS for the Stock Analysis application.

## Overview

The application has been successfully migrated from Supabase to AWS with the following architecture changes:

### Before (Supabase)
- **Backend**: Deno Edge Functions
- **Database**: PostgreSQL (KV Store pattern)
- **Hosting**: Supabase Edge Network
- **Deployment**: `supabase deploy`

### After (AWS)
- **Backend**: Node.js 20 Lambda Functions
- **Database**: DynamoDB
- **API**: API Gateway (HTTP API)
- **Deployment**: AWS SAM (`sam deploy`)

## Migration Benefits

1. **Cost**: More predictable pricing with AWS Free Tier
2. **Scale**: DynamoDB auto-scales to handle traffic spikes
3. **Flexibility**: Full control over AWS infrastructure
4. **Integration**: Easy integration with other AWS services
5. **Performance**: DynamoDB provides consistent single-digit millisecond latency

## What Changed

### Infrastructure

| Component | Supabase | AWS |
|-----------|----------|-----|
| Compute | Edge Functions (Deno) | Lambda (Node.js 20) |
| Database | PostgreSQL | DynamoDB |
| API Gateway | Built-in | API Gateway HTTP API |
| Auth | Supabase Auth | None (can add later) |
| Storage | Supabase Storage | Not used |
| Realtime | Supabase Realtime | Not used |

### Code Changes

1. **Runtime Migration**: Deno → Node.js
   - Changed from `Deno.env.get()` to `process.env`
   - Replaced `fetch()` with `axios` for consistency
   - Converted JSR imports to npm packages

2. **Database Migration**: PostgreSQL → DynamoDB
   - KV store interface remains the same
   - Underlying implementation uses DynamoDB SDK
   - All CRUD operations maintained compatibility

3. **API Routes**: Unchanged
   - All endpoints remain identical
   - Response formats unchanged
   - Client code requires no modification

### File Structure

```
New AWS Files:
├── aws/
│   ├── template.yaml              # CloudFormation/SAM template
│   ├── lambda/
│   │   ├── src/
│   │   │   ├── index.ts          # Lambda handler (converted from Deno)
│   │   │   ├── kv_store.ts       # DynamoDB wrapper
│   │   │   ├── evidence.ts       # Evidence module (ported)
│   │   │   ├── financialScores.ts # Financial scores (ported)
│   │   │   └── smartSearch.ts    # Search module (ported)
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── deploy.sh                 # Deployment script
│   ├── samconfig.toml.example    # SAM config template
│   └── README.md                 # AWS deployment guide
├── src/utils/aws/
│   └── info.tsx                  # AWS configuration
├── .env.example                  # Environment variables template
└── MIGRATION_GUIDE.md            # This file

Existing Files (Modified):
├── src/utils/api.tsx             # Updated to support both Supabase & AWS
```

## Migration Steps

### Step 1: Prepare AWS Account

1. Create an AWS account if you don't have one
2. Install AWS CLI and configure credentials:
   ```bash
   aws configure
   ```
3. Install AWS SAM CLI:
   ```bash
   # macOS
   brew install aws-sam-cli

   # Windows
   choco install aws-sam-cli

   # Linux
   pip install aws-sam-cli
   ```

### Step 2: Deploy AWS Infrastructure

```bash
cd aws
./deploy.sh
```

This will:
- Build the Lambda function
- Create DynamoDB table
- Deploy API Gateway
- Set up IAM roles and permissions

### Step 3: Configure Frontend

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your AWS API endpoint:
   ```env
   REACT_APP_USE_AWS=true
   REACT_APP_AWS_API_URL=https://YOUR-API-ID.execute-api.REGION.amazonaws.com/dev/
   REACT_APP_AWS_REGION=us-east-1
   ```

3. Restart your development server:
   ```bash
   npm start
   ```

### Step 4: Migrate Data (Optional)

If you have existing data in Supabase that you want to migrate to AWS:

1. Export data from Supabase:
   ```sql
   -- Connect to Supabase database
   COPY (SELECT key, value FROM kv_store_517ac4ba) TO STDOUT WITH CSV HEADER;
   ```

2. Create a migration script:
   ```javascript
   // migrate-data.js
   const AWS = require('aws-sdk');
   const fs = require('fs');
   const csv = require('csv-parser');

   const dynamodb = new AWS.DynamoDB.DocumentClient();
   const tableName = 'YOUR-TABLE-NAME';

   fs.createReadStream('export.csv')
     .pipe(csv())
     .on('data', async (row) => {
       await dynamodb.put({
         TableName: tableName,
         Item: {
           key: row.key,
           value: JSON.parse(row.value)
         }
       }).promise();
     });
   ```

3. Run the migration script:
   ```bash
   node migrate-data.js
   ```

### Step 5: Test the Migration

1. **Health Check**:
   ```bash
   curl https://YOUR-API.execute-api.REGION.amazonaws.com/dev/health
   ```

2. **Stock Analysis**:
   ```bash
   curl https://YOUR-API.execute-api.REGION.amazonaws.com/dev/stock/AAPL
   ```

3. **Frontend Testing**:
   - Open the application in your browser
   - Test stock analysis
   - Verify cache functionality
   - Test ticker management

### Step 6: Switch to AWS (Production)

Once testing is complete:

1. Update production environment variables
2. Point your domain to AWS API Gateway (if using custom domain)
3. Monitor CloudWatch Logs for any issues
4. Set up CloudWatch Alarms for monitoring

## Rollback Plan

If you need to rollback to Supabase:

1. Change `.env`:
   ```env
   REACT_APP_USE_AWS=false
   ```

2. Restart the application:
   ```bash
   npm start
   ```

The application will automatically switch back to Supabase.

## Cost Comparison

### Supabase
- **Free Tier**: 500 MB database, 2 GB bandwidth
- **Pro**: $25/month (8 GB database, 50 GB bandwidth)

### AWS (Estimated)
- **Lambda**: ~$0-2/month (with free tier: 1M requests)
- **DynamoDB**: ~$0-3/month (with free tier: 25 GB storage)
- **API Gateway**: ~$0-1/month (with free tier: 1M requests)
- **Total**: ~$0-6/month (very low usage)

## Performance Comparison

| Metric | Supabase | AWS |
|--------|----------|-----|
| Cold Start | ~200-500ms | ~500-1000ms |
| Warm Request | ~50-100ms | ~50-100ms |
| Database Query | ~10-50ms | ~5-10ms (DynamoDB) |
| Geographic Distribution | Multi-region | Region-specific (can add CloudFront) |

## Troubleshooting

### Issue: Lambda function times out

**Solution**: Increase timeout in `template.yaml`:
```yaml
Globals:
  Function:
    Timeout: 60  # Increase from 30 to 60
```

### Issue: DynamoDB throttling

**Solution**: Increase capacity or use on-demand billing:
```yaml
BillingMode: PAY_PER_REQUEST  # Already set in template
```

### Issue: CORS errors

**Solution**: Verify CORS configuration in `template.yaml` and redeploy.

### Issue: API key not working

**Solution**: Verify environment variables were set during deployment:
```bash
aws lambda get-function-configuration \
  --function-name YOUR-FUNCTION-NAME \
  --query Environment.Variables
```

## Monitoring & Maintenance

### CloudWatch Logs

View logs:
```bash
sam logs --stack-name stock-analysis-app --tail
```

### CloudWatch Metrics

Monitor in AWS Console:
1. Lambda → Functions → stock-analysis-app-server → Monitor
2. DynamoDB → Tables → stock-analysis-app-kv-store → Metrics
3. API Gateway → APIs → stock-analysis-app → Monitor

### Cost Monitoring

Set up billing alerts:
1. AWS Console → Billing → Budgets
2. Create budget for $10/month
3. Set alert thresholds

## Next Steps

- [ ] Set up custom domain with Route 53
- [ ] Add CloudFront CDN for caching
- [ ] Implement API authentication (Cognito or API keys)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add monitoring and alerting (CloudWatch Alarms)
- [ ] Implement backup strategy (DynamoDB backups)
- [ ] Add WAF for security

## Support Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)

## FAQ

**Q: Can I use both Supabase and AWS simultaneously?**

A: Yes! The frontend supports switching between backends via environment variable. This is useful for gradual migration or A/B testing.

**Q: Will my Supabase API keys still work?**

A: No. AWS uses API Gateway which has different authentication. You can add API Gateway authorizers if needed.

**Q: How do I add more Lambda functions?**

A: Edit `template.yaml` and add new function resources under the `Resources` section.

**Q: Can I use PostgreSQL instead of DynamoDB?**

A: Yes, but you'll need to modify the code. Consider using Amazon RDS for PostgreSQL.

**Q: What about file uploads/storage?**

A: The current app doesn't use file storage. If needed, use Amazon S3 instead of Supabase Storage.

## Conclusion

The migration to AWS provides:
- ✅ Better cost control and predictability
- ✅ Higher performance for database operations
- ✅ Greater flexibility and customization
- ✅ Enterprise-grade scalability
- ✅ Seamless integration with AWS ecosystem

The application maintains full compatibility with the original Supabase version, allowing for easy rollback if needed.
