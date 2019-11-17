## Static Android App Analyzer and Classifier

This research focuses on classifying android samples using static analysis. The first version of this package covers the data collection and static feature extraction. The second version will focus on developing a classification model using AI.
The project has been supported by Mitacs Globalink Program by providing a research internship and CSE/CCCS by providing 200K Android malware samples. 

## Version 1: 

--> Data collection: We used the Androzoo dataset for collecting 200K Benign samples (https://androzoo.uni.lu/) and received 200K malware samples from the Communication Security Establishment (CSE) and the Canadian Center of Cyber Security (CCCS).

--> Feature Extraction: The static analysis for android malware detection has proven a very quick and effective way to deal with the code. We extract these static features: permissions, Intents (Actions and Categories), Services, The number of activities, meta-data, Icons, Pictures, audios, videos and the size of the app. Then these features are collected to create a binary vector for each app.

------------------------------------------------------

In each folder, there is a ReadMe.md file on how to run the scripts. 

Every script can be used independently.
