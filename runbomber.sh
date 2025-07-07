#!/bin/bash

 

# Function to open a new Terminal window and run a command
run_in_new_terminal_mac() {
  local CMD=$1
  osascript <<EOF
tell application "Terminal"
    activate
    do script "${CMD}"
end tell
EOF
}

# Build absolute paths
FRONTEND_PATH=$(cd game/server && pwd)
BACKEND_PATH=$(cd server && pwd)

# Start frontend in new terminal
run_in_new_terminal_mac "cd '${FRONTEND_PATH}'; npm install; npm start"

# Start backend in another new terminal
run_in_new_terminal_mac "cd '${BACKEND_PATH}'; npm start"