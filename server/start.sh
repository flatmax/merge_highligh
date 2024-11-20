#!/bin/bash

# Start Pyro5 server in the background
python server.py &
PYRO_PID=$!

# Wait a moment for Pyro5 server to start
sleep 2

# Start FastAPI server on port 3000
uvicorn api:app --host 0.0.0.0 --port 3000

# When FastAPI server stops, kill the Pyro5 server
kill $PYRO_PID
