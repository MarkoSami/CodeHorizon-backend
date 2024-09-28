#include <iostream>
#include <nlohmann/json.hpp>
#include <vector>
#include <unordered_map>
#include <string>
#include <future>
#include <chrono>
#include <sys/resource.h>


using namespace std;


size_t getCurrentMemoryUsage() {
    struct rusage usage;
    getrusage(RUSAGE_SELF, &usage);
    return usage.ru_maxrss; // Memory usage in kilobytes
}



$&{FINJECT}&$

    int
    main(int argc, char *argv[])
{
    // Check if at least one argument is provided
    if (argc < 2)
    {
        std::cerr << "NO JSON input provided" << std::endl;
        return 1;
    }

    nlohmann::json resultJson;
    resultJson["result"] = "ACC"; // Default to accepted
	size_t baseMemoryUsage = getCurrentMemoryUsage(); // Base memory usage
    try
    {
        nlohmann::json inputData = nlohmann::json::parse(argv[1]);
        nlohmann::json testCases = inputData["testCases"];
        int n = testCases.size();

        for (int i = 0; i < n; i++)
        {
            nlohmann::json data = testCases[i];

 		// Get memory limit
            int memoryLimit = data["memoryInMB"].get<int>() * 1024; // Convert MB to KB
		cout<< "MemoryLimit from test case: "<< memoryLimit<< endl;
            

            // Start the long-running function asynchronously
            auto future = std::async(std::launch::async, $&{FNAME}&$, $&{FPARAMS}&$);

            // Set the timeout
            std::chrono::seconds timeout(data["timeInMS"].get<int>() / 1000);
            if (future.wait_for(timeout) == std::future_status::timeout)
            {
                resultJson["result"] = "TLE"; // Time Limit Exceeded
                resultJson["failedTestCaseIndex"] = i;
                std::cout << resultJson.dump() << std::endl;
                return 0;
            }

            std::vector<int> output = future.get(); // Get a pair of indices
            nlohmann::json expectedOutputs = data["output"];
	
		// Check memory usage after function execution
            size_t currentMemoryUsage = getCurrentMemoryUsage();
            size_t totalMemoryLimit = baseMemoryUsage + memoryLimit;
cout<< "currentMemoryUsage: "<< currentMemoryUsage  <<endl;
		cout<< "totalMemoryLimit: "<< totalMemoryLimit  <<endl;

            if ( currentMemoryUsage  > totalMemoryLimit )
            {
		
                resultJson["result"] = "MLE"; // Memory Limit Exceeded
                resultJson["failedTestCaseIndex"] = i;
                std::cout << resultJson.dump() << std::endl;
                return 0;
            }

            // Compare the output with the expected outputs
            bool matchFound = false;
            for (const auto &expected : expectedOutputs)
            {
                if (output == expected.get<std::vector<int>>())
                {
                    matchFound = true;
                    break; // Break if a matching output is found
                }
            }

            if (!matchFound)
            {
                resultJson["result"] = "WA"; // Wrong Answer
                resultJson["failedTestCaseIndex"] = i;
                std::cout << "Expected Outputs: " << expectedOutputs.dump() << std::endl;
                std::cout << "Actual Output: " << nlohmann::json(output).dump() << std::endl;
                std::cout << resultJson.dump() << std::endl;
                return 0;
            }
        }

        // If all test cases pass
        std::cout << resultJson.dump() << std::endl;
    }
    catch (const std::exception &e)
    {
        std::cerr << "Error parsing JSON: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
