# Server: local development and AWS deployment

## Connection layout

Keep the RDS PostgreSQL instance private in the same VPC as the EC2 application server. Allow inbound TCP 5432 on the RDS security group only from the EC2 security group. The EC2 security group should expose only the application ports you need (normally HTTPS through a reverse proxy/load balancer; do not expose PostgreSQL publicly).

For local development, use an AWS Systems Manager (SSM) port-forwarding session through an SSM-managed EC2 instance that can reach RDS. This avoids making RDS public or allow-listing a changing home IP. The instance needs SSM permissions/connectivity and network access to the RDS security group.

## Local workflow

1. Copy `.env.example` to `.env` and replace the database user, password, and database name. Keep `.env` untracked; never commit real credentials.
2. Start an SSM tunnel from your local terminal, replacing the placeholders:

   ```sh
   aws ssm start-session --target i-INSTANCE_ID --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters '{"host":["coded-ticketing.c6vya408u1jo.us-east-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["5433"]}'
   ```

3. Keep that tunnel running. The local `.env` uses `127.0.0.1:5433` and connects through it to private RDS. Replace `SET_NEW_ROTATED_PASSWORD` with your newly rotated database password; percent-encode URL-reserved characters in it.
4. In another terminal, run `npm run db:generate`, then `npm run db:migrate` when applying development schema changes, and `npm run dev` to run the API.
5. Check `http://localhost:8080/health/db` for database connectivity. `npm run build` compiles the server without requiring a live AWS connection.

## EC2 runtime

Set `DATABASE_URL` and `PORT` as environment variables on EC2 (or inject them from AWS Secrets Manager/SSM Parameter Store); use the private RDS endpoint and port 5432. Do not copy the local tunnel URL to EC2. Build the project with `npm ci`, `npm run db:generate`, and `npm run build`; apply committed migrations with `npm run db:deploy`, then run `npm start` under a process manager such as systemd. Keep secrets out of source control and logs.

Set `CLIENT_ORIGINS` to a comma-separated list of exact browser origins that are allowed to call the API, for example `https://your-frontend-domain.example` (and `http://localhost:5173` only when local development needs access). In the frontend, set `VITE_API_URL` to the API's public HTTPS origin. Vite variables are included in the browser build and must never contain secrets.

The application listens on `0.0.0.0` so it can receive traffic on EC2; configure the EC2 security group and a reverse proxy/load balancer so only intended web traffic reaches it. The AWS resources, credentials, security groups, and SSM access must be configured in your AWS account; this project does not contain or assume AWS credentials.
