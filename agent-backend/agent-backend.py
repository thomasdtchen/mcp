
import json
from openai import OpenAI
import os
from dotenv import load_dotenv


# Load environment variables from .env file
load_dotenv()

# Configuration from environment variables
config = {
    "api_key": os.getenv("API_KEY"),
    "base_url": os.getenv("BASE_URL")
}

# Initialize Client
client = OpenAI(
    api_key=config["api_key"],
    base_url=config["base_url"]
)

# Define tools (similar to OpenAI's function calling)
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather in a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g., San Francisco, CA",
                    },
                },
                "required": ["location"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "buy_umbrella",
            "description": "Purchase an umbrella",
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["single", "double", "large"],
                        "description": "Type of the umbrella.",
                    },
                    "quantity": {
                        "type": "number",
                        "description": "Number of umbrellas to buy.",
                        "default": 1
                    }
                },
                "required": ["type"],
            },
        },
    }
]

# Example function implementations
def execute_tool(tool_name, arguments):
    """Mock execution of local tools/functions."""
    if tool_name == "get_weather":
        # In a real scenario, call your weather MCP server here
        return json.dumps({"status": "success", "data": {"location": arguments.get("location"), "temperature": "25", "condition": "rainy"}})
    elif tool_name == "buy_umbrella":
        # In a real scenario, call your umbrella MCP server here
        return json.dumps({"status": "success", "data": {"order_id": "12345", "type": arguments.get("type"), "quantity": arguments.get("quantity", 1), "total_price": 10 * arguments.get("quantity", 1)}})
    else:
        return json.dumps({"status": "error", "message": f"Unknown tool: {tool_name}"})

# Main agent loop
def run_agent(user_query):
    messages = [{"role": "user", "content": user_query}]

    while True:
        # Step 1: Send conversation and available tools to the model
        response = client.chat.completions.create(
            model="deepseek-reasoner",  # Or "deepseek-r1" for reasoning model
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )

        message = response.choices[0].message
        print(f"AI: {message.content}")

        # Step 2: Check if the model called a function
        if not message.tool_calls:
            break

        # Step 3: Execute the function calls
        for tool_call in message.tool_calls:
            func_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            print(f"Executing: {func_name} with args: {args}")

            # Execute the corresponding function
            result = execute_tool(func_name, args)
            print(f"Result: {result}")

            # Step 4: Send the result back to the model
            messages.append(message)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

    # Final response from the model
    return message.content

# Run the agent with an example
if __name__ == "__main__":
    user_input = "Check the weather in Shenzhen. If it's raining, buy a single umbrella."
    final_response = run_agent(user_input)
    print(f"\nFinal Answer: {final_response}")
    user_input = "We will travel to ShangHai and we have 3 people and haven't taken umbrella, please check the weather and give suggestion."
    final_response = run_agent(user_input)
    print(f"\nFinal Answer: {final_response}")