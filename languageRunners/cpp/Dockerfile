# Use an official GCC image with build essentials
FROM gcc:latest

# Install dependencies: the nlohmann/json library via wget
RUN apt-get update && apt-get install -y wget \
    && mkdir -p /usr/local/include/nlohmann \
    && wget https://github.com/nlohmann/json/releases/download/v3.11.2/json.hpp -O /usr/local/include/nlohmann/json.hpp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the source code
COPY runInstance.cpp .

# Compile the application using g++
RUN g++ -o myapp runInstance.cpp

# No ENTRYPOINT specified
