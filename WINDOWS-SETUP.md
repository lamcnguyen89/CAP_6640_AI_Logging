# Windows Development Setup Guide

This guide covers setting up VERA for development on Windows using WSL (Windows Subsystem for Linux) and Docker Desktop.

## Prerequisites

- Windows 10 version 2004 or higher (Build 19041 and higher)
- Administrator access on your Windows machine

## Step 1: Install Windows Subsystem for Linux (WSL)

1. **Open Command Prompt as Administrator**

   - Press `Win + X` and select "Windows Terminal (Admin)" or "Command Prompt (Admin)"

2. **Install WSL with Ubuntu**

   ```cmd
   wsl --install -d Ubuntu
   ```

3. **Restart your computer** when prompted

4. **Complete Ubuntu setup**
   - After restart, Ubuntu will launch automatically
   - Create a username and password when prompted
   - Update the system:
     ```bash
     sudo apt update && sudo apt upgrade -y
     ```

## Step 2: Install Docker Desktop

1. **Download Docker Desktop**

   - Visit [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - Download and run the installer

2. **Enable WSL Integration**
   - Start Docker Desktop
   - Go to **Settings** → **Resources** → **WSL Integration**
   - Check "Enable integration with my default WSL distro"
   - Enable integration for Ubuntu under "Enable integration with additional distros"
   - Click **Apply & Restart**

## Step 3: Install VS Code

1. **Download VS Code**

   - Visit [https://code.visualstudio.com/](https://code.visualstudio.com/)
   - Install the Windows version

2. **Install Required Extensions**
   - **WSL** - Microsoft
   - **Remote - SSH** - Microsoft
   - **Remote Explorer** - Microsoft
   - **Docker** - Microsoft
   - **GitHub Pull Requests and Issues** - GitHub

## Step 4: Configure VS Code with WSL

1. **Connect to WSL**

   - Open VS Code
   - Click the blue box in the bottom-left corner (Remote indicator)
   - Select "Connect to WSL" → "Ubuntu"

2. **Install Additional Extensions in WSL**
   - Once connected to WSL, install these extensions in the WSL environment:
   - **TypeScript and JavaScript Language Features**
   - **Jest** - Orta
   - **ES7+ React/Redux/React-Native snippets**

## Step 5: Set Up Node.js in WSL

1. **Start WSL Terminal**

   ```cmd
   wsl -d Ubuntu
   ```

2. **Install curl** (if not already installed)

   ```bash
   sudo apt-get update
   sudo apt-get install curl
   ```

3. **Install NVM (Node Version Manager)**

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
   ```

4. **Restart your terminal or reload bash profile**

   ```bash
   source ~/.bashrc
   ```

5. **Install Node.js version 16**

   ```bash
   nvm install 16
   nvm use 16
   ```

6. **Verify installation**
   ```bash
   node --version  # Should show v16.x.x
   npm --version   # Should show npm version
   ```

## Step 6: Clone and Set Up VERA

1. **Navigate to your preferred directory in WSL**

   ```bash
   cd ~
   # or create a projects directory
   mkdir projects && cd projects
   ```

2. **Clone the repository**

   ```bash
   git clone [repository-url]
   cd vera
   ```

3. **Verify Docker is accessible from WSL**
   ```bash
   docker --version
   docker-compose --version
   ```

## Step 7: Start Development Environment

1. **Ensure Docker Desktop is running** on Windows

2. **Start VERA development environment**

   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Verify services are running**

   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```

4. **Test the application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## VS Code Development Workflow

1. **Open project in WSL**

   - In VS Code, use `Ctrl+Shift+P`
   - Type "WSL: Open Folder in WSL"
   - Navigate to your VERA project directory

2. **Use integrated tasks**

   - `Ctrl+Shift+P` → "Tasks: Run Task"
   - Select from available VERA tasks (Docker management, testing, etc.)

3. **Debugging**
   - Use the configured launch configurations for Jest debugging
   - Set breakpoints in TypeScript files
   - Debug both frontend and backend code

## Troubleshooting

### WSL Issues

- **WSL not starting**: Run `wsl --shutdown` then `wsl -d Ubuntu`
- **Permission issues**: Ensure you're running commands from your home directory in WSL
- **Slow performance**: Store project files in WSL filesystem (`/home/username/`) not Windows filesystem

### Docker Issues

- **Docker not accessible**: Restart Docker Desktop and ensure WSL integration is enabled
- **Port conflicts**: Check if other services are using ports 3000, 5000, or 27017
- **Container build failures**: Run `docker system prune` to clean up cached layers

### VS Code Issues

- **Extensions not working**: Ensure extensions are installed in WSL, not just Windows
- **Terminal not finding commands**: Reload VS Code window (`Ctrl+Shift+P` → "Developer: Reload Window")

### Performance Tips

- **File watching**: Use WSL filesystem for better performance with hot reload
- **Memory usage**: Adjust Docker Desktop memory limits in Settings → Resources
- **Build caching**: Use `docker-compose up -d --build` only when necessary

## Additional Resources

- [WSL Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [Docker Desktop WSL 2 Backend](https://docs.docker.com/desktop/windows/wsl/)
- [VS Code WSL Development](https://code.visualstudio.com/docs/remote/wsl)

## Next Steps

After completing this setup:

1. Follow the main [README.md](README.md) for development workflow
2. Set up external integrations using [INTEGRATIONS.md](INTEGRATIONS.md)
3. Review testing documentation in [TESTING.md](TESTING.md)
