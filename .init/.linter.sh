#!/bin/bash
cd /home/kavia/workspace/code-generation/classic-ludo-play-1101-1115/ludo_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

