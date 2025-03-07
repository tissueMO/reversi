FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:22-bullseye

USER node
WORKDIR /app/workspace
EXPOSE 3000

CMD ["bash"]
