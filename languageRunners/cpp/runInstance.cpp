#include <iostream>
#include <nlohmann/json.hpp>
#include <vector>
#include <unordered_map>
#include <string>
#include <any>
using namespace std;

std::vector<int> twoSum(std::vector<int> nums, int target) {
    std::unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); ++i) {
        if (map.count(target - nums[i])) {
            return {map[target - nums[i]], i};
        } else {
            map[nums[i]] = i;
        }
    }
    return {};
}

    int
    main(int argc, char *argv[])
{
    // Check if at least one argument is provided
    if (argc < 2)

    {
        std::cerr << "NO JSON input provided" << std::endl;
        return 1;
    }

    try

    {
	// Parse the JSON string passed as the second command-line argument (argv[1])
        nlohmann::json inputData = nlohmann::json::parse(argv[1]);
	
        // Extract the test cases
        nlohmann::json data = inputData["testCase"];
	
        nlohmann::json result;
        result["solution"] = twoSum(data["nums"], data["target"]);;
        cout << result.dump();
	

        

 
    }
    catch (const std::exception &e)

    {
        std::cerr << "Error parsing JSON: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
