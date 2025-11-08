# hermes
Docker Container that proxies UDP datagram messages to AWS SQS

# setup
```sh
# replace AWS_REGION with whatever your aws region is like us-west-1
aws ecr create-repository --repository-name "hermes" --region "AWS_REGION"

# build the Docker image
docker build -t hermes .

# tag the image with the full ECR URI
# replace AWS_ACCOUNT_ID and AWS_REGION
docker tag hermes:latest AWS_ACCOUNT_ID.dkr.ecr.AWS_REGION.amazonaws.com/hermes:latest

aws ecr get-login-password --region AWS_REGION | docker login --username AWS --password-stdin AWS_ACCOUNT_ID.dkr.ecr.AWS_REGION.amazonaws.com

docker push AWS_ACCOUNT_ID.dkr.ecr.AWS_REGION.amazonaws.com/hermes:latest
```
