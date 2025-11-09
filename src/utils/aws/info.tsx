/**
 * AWS Configuration
 * Replace these values after deploying your stack
 */

// Set this to your API Gateway endpoint after deployment
// Example: https://abcd1234.execute-api.us-east-1.amazonaws.com/dev/
export const apiGatewayUrl = process.env.REACT_APP_AWS_API_URL || '';

// AWS Region where your resources are deployed
export const awsRegion = process.env.REACT_APP_AWS_REGION || 'us-east-1';

// Stack name (used for CloudFormation)
export const stackName = process.env.REACT_APP_AWS_STACK_NAME || 'stock-analysis-app';
