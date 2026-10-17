import os
import zipfile

def create_project_zip(output_path, root_dir):
    # Exclude unwanted directories and files
    exclude_dirs = {
        'node_modules',
        '.git',
        'dist',
        '.vite',
        '.aistudio',
        '__pycache__'
    }
    exclude_files = {
        'naftal-station-app.zip',
        '.DS_Store'
    }

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(root_dir):
            # Modify dirs in-place to prevent walking into excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                if file in exclude_files:
                    continue
                file_path = os.path.join(root, file)
                # Compute relative path for archive
                rel_path = os.path.relpath(file_path, root_dir)
                # Nest inside a root folder 'naftal-station-app/' so it extracts cleanly
                arc_name = os.path.join('naftal-station-app', rel_path)
                zipf.write(file_path, arc_name)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Project ZIP created successfully at {output_path} ({size_mb:.2f} MB)")

if __name__ == '__main__':
    os.makedirs('public', exist_ok=True)
    create_project_zip('public/naftal-station-app.zip', '.')
