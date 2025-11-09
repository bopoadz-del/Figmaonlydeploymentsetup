/**
 * DynamoDB Key-Value Store
 * Migrated from Supabase PostgreSQL KV Store
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  BatchWriteCommand,
  BatchGetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE!;

/**
 * Set stores a key-value pair in DynamoDB.
 */
export const set = async (key: string, value: any): Promise<void> => {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        key,
        value,
      },
    })
  );
};

/**
 * Get retrieves a key-value pair from DynamoDB.
 */
export const get = async (key: string): Promise<any> => {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { key },
    })
  );
  return result.Item?.value;
};

/**
 * Delete removes a key-value pair from DynamoDB.
 */
export const del = async (key: string): Promise<void> => {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { key },
    })
  );
};

/**
 * Sets multiple key-value pairs in DynamoDB.
 * Uses BatchWriteItem for efficiency (max 25 items per batch).
 */
export const mset = async (keys: string[], values: any[]): Promise<void> => {
  if (keys.length === 0) return;

  // DynamoDB BatchWriteItem has a limit of 25 items
  const batchSize = 25;
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    const requests = batch.map((k, idx) => ({
      PutRequest: {
        Item: {
          key: k,
          value: values[i + idx],
        },
      },
    }));

    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: requests,
        },
      })
    );
  }
};

/**
 * Gets multiple key-value pairs from DynamoDB.
 * Uses BatchGetItem for efficiency (max 100 items per batch).
 */
export const mget = async (keys: string[]): Promise<any[]> => {
  if (keys.length === 0) return [];

  const results: any[] = [];

  // DynamoDB BatchGetItem has a limit of 100 items
  const batchSize = 100;
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);

    const result = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: batch.map((k) => ({ key: k })),
          },
        },
      })
    );

    const items = result.Responses?.[TABLE_NAME] || [];
    // Maintain order by matching keys
    for (const key of batch) {
      const item = items.find((i) => i.key === key);
      results.push(item?.value);
    }
  }

  return results;
};

/**
 * Deletes multiple key-value pairs from DynamoDB.
 * Uses BatchWriteItem for efficiency (max 25 items per batch).
 */
export const mdel = async (keys: string[]): Promise<void> => {
  if (keys.length === 0) return;

  // DynamoDB BatchWriteItem has a limit of 25 items
  const batchSize = 25;
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    const requests = batch.map((k) => ({
      DeleteRequest: {
        Key: { key: k },
      },
    }));

    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: requests,
        },
      })
    );
  }
};

/**
 * Search for key-value pairs by prefix.
 * Note: DynamoDB doesn't support LIKE queries natively.
 * We use a Scan operation with FilterExpression.
 * For production with large datasets, consider using a GSI.
 */
export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const results: any[] = [];
  let lastEvaluatedKey: any = undefined;

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(#key, :prefix)",
        ExpressionAttributeNames: {
          "#key": "key",
        },
        ExpressionAttributeValues: {
          ":prefix": prefix,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (result.Items) {
      results.push(...result.Items.map((item) => item.value));
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return results;
};
