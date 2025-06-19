# Ufit Server Setup Guide

## OpenAI API Key Configuration

The chatbot functionality in this application requires a valid OpenAI API key to work properly. Follow these steps to set up your API key:

1. Sign up for an account at [OpenAI](https://platform.openai.com/signup)
2. Generate an API key from the [API Keys page](https://platform.openai.com/api-keys)
3. Open the `application.properties` file in `src/main/resources/`
4. Replace the placeholder value for `openai.api.key` with your actual API key:

```properties
# OpenAI Configuration
openai.api.key=YOUR_ACTUAL_API_KEY_HERE
```

## Error: 401 Unauthorized

If you see a "401 Unauthorized" error in the chatbot, it means your OpenAI API key is invalid or has expired. Check the following:

1. Verify that you've entered the correct API key in `application.properties`
2. Make sure your OpenAI account has sufficient credits or a valid payment method
3. Check if the API key has been revoked or expired in your OpenAI dashboard

## Running the Application

To run the server:

```bash
./mvnw spring-boot:run
```

The server will start on port 8080 by default. 