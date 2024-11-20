import os
import Pyro5.api
from file_service import FileService

# Get the project root directory (one level up from server directory)
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Create and register the FileService
file_service = FileService(root_dir=root_dir)
daemon = Pyro5.api.Daemon(host="localhost", port=9999)  # Specify port 9999
uri = daemon.register(file_service, "file.service")

print(f"File service URI: {uri}")
print(f"Serving files from: {root_dir}")
daemon.requestLoop()
