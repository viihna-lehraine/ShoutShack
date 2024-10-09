import secrets
import os

def generate_jwt_secret(length=64):
    """Generate a cryptographically secure JWT secret."""
    return secrets.token_hex(length)

def append_after_jwt_secret(file_path, key, value):
    """Append the key-value pair right after any line starting with key in the .env file."""
    key_found = False
    with open(file_path, 'r') as file:
        lines = file.readlines()

    with open(file_path, 'w') as file:
        for line in lines:
            file.write(line)
            if line.startswith(f"{key}="):
                file.write(f'{key}={value}\n')
                key_found = True

        if not key_found:
            file.write(f'{key}={value}\n')

    # Print the file content to the console
    with open(file_path, 'r') as file:
        print(file.read())

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, '../.env')  # Adjusted to use the relative path "../.env"
    
    print(f"Looking for .env file at: {file_path}")  # Debug information

    if os.path.isfile(file_path):
        jwt_secret = generate_jwt_secret()
        append_after_jwt_secret(file_path, '\nJWT_SECRET', jwt_secret)
        print(f"Successfully appended JWT_SECRET to {file_path}")
    else:
        print(f"Error: {file_path} not found.")

if __name__ == "__main__":
    main()