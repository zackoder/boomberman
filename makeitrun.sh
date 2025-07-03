#!/bin/bash

gnome-terminal -- bash -c "
cd game/server
npm install
npm start
exec bash
"

# Start backend in another new terminal
gnome-terminal -- bash -c "
cd server
npm start
exec bash
"