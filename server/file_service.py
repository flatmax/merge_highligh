import os
import Pyro5.api

@Pyro5.api.expose
class FileService:
    def __init__(self, root_dir="/"):
        self.root_dir = os.path.abspath(root_dir)

    def list_directory(self, path=None):
        """List contents of a directory"""
        current_dir = os.path.join(self.root_dir, path) if path else self.root_dir
        current_dir = os.path.abspath(current_dir)
        
        # Security check to prevent directory traversal
        if not current_dir.startswith(self.root_dir):
            raise ValueError("Access denied: Directory traversal attempt")
            
        items = []
        try:
            for item in os.listdir(current_dir):
                full_path = os.path.join(current_dir, item)
                rel_path = os.path.relpath(full_path, self.root_dir)
                items.append({
                    'name': item,
                    'path': rel_path,
                    'type': 'directory' if os.path.isdir(full_path) else 'file'
                })
            return items
        except Exception as e:
            return {'error': str(e)}

    def read_file(self, path):
        """Read contents of a file"""
        full_path = os.path.join(self.root_dir, path)
        full_path = os.path.abspath(full_path)
        
        # Security check
        if not full_path.startswith(self.root_dir):
            raise ValueError("Access denied: Directory traversal attempt")
            
        try:
            with open(full_path, 'r') as f:
                return {'content': f.read()}
        except Exception as e:
            return {'error': str(e)}
