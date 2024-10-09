import secrets
import base64
import os

def generate_pepper(length=32):
    """Generate a cryptographically secure password pepper."""
    pepper_bytes = secrets.token_bytes(length)
    pepper_base64 = base64.urlsafe_b64encode(pepper_bytes).decode('utf-8')
    return pepper_base64

def append_pepper_to_env(file_path, pepper):
    """Append the pepper to the specified .env file right after any existing PEPPER= line."""
    with open(file_path, 'r') as file:
        lines = file.readlines()

    with open(file_path, 'w') as file:
        pepper_appended = False
        for line in lines:
            file.write(line)
            if line.startswith('PEPPER='):
                file.write(f'PEPPER={pepper}\n')
                pepper_appended = True

        if not pepper_appended:
            file.write(f'PEPPER={pepper}\n')

    with open(file_path, 'r') as file:
        print(file.read())

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, '../.env')

    print(f"Looking for .env file at: {file_path}")

    if os.path.isfile(file_path):
        pepper = generate_pepper()
        append_pepper_to_env(file_path, pepper)
        print(f"Successfully appended PEPPER to {file_path}")
    else:
        print(f"Error: {file_path} not found.")

if __name__ == "__main__":
    main()
