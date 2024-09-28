# Use an official GCC image with build essentials
FROM gcc:latest

# Install dependencies
RUN apt-get update && apt-get install -y wget

# Download the nlohmann/json.hpp library (putting this step earlier to cache)
RUN mkdir -p /usr/local/include/nlohmann \
    && wget https://github.com/nlohmann/json/releases/download/v3.11.2/json.hpp -O /usr/local/include/nlohmann/json.hpp

# Clean up
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /usr/src/app

# Copy the source code after dependencies (to leverage caching for previous layers)
COPY runInstance.cpp .

# Compile the application using g++
# RUN g++ -o myapp runInstance.cpp

# Keep the container running
CMD ["tail", "-f", "/dev/null"]
