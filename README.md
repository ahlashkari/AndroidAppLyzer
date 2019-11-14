## Static Android App Analyzer and Classifier

This project focuses on classify android samples using static analysis. The first version of this package covers the data collection and static feature extraction. The second version will develop a classification model using extracted static features.

## Version 1: 

--> Data collection: We used the Androzoo data set https://androzoo.uni.lu/ to collect the data.

--> Feature Extraction: The static analysis for android malware detection has proven a very quick and effective way to deal with the code. We extract these static features: permissions, Intents (Actions and Categories), Services, The number of activities, meta-data, Icons, Pictures, audios, videos and the size of the app. Then these features are collected to create a binary vector for each app.

------------------------------------------------------

In each folder, there is a ReadMe.md file on how to run the scripts. 

Every script can be used independently.
