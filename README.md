## Static and Dynamic Android App Analyzer and Classifier

This research focuses on classifying android samples using static and dynamic analysis. The first version of this package covers the data collection and static feature extraction. The second version will focus on developing a classification model using AI for static features. The third version will add the dynamic analysis module and related features to improve the classifier.
 
This project has been supported by Mitacs Globalink Program (providing a research internship from Tunisia) and Harrison McCain Foundation Young Scholar Awards (providing enough fund for a 4-months coop student). The 200K Android malware samples provided by the Communication Security Establishment (CSE) and the Canadian Center for Cyber Security (CCCS). 

## Contributors:
Arash Habibi Lashkari: Founder

Abir Rahali: Researcher and Developer (Mitacs Globalink Program)

Francois Gagnon: Malware Dataset Provider (CSE/CCCS)

## Version 1: 

--> Data collection: We used the Androzoo dataset for collecting 200K Benign samples (https://androzoo.uni.lu/) and received 200K malware samples from CSE/CCCS.

--> Feature Extraction: The static analysis for android malware detection has proven a very quick and effective way to deal with the code. We extract these static features: permissions, Intents (Actions and Categories), Services, The number of activities, meta-data, Icons, Pictures, audios, videos and the size of the app. Then these features are collected to create a binary vector for each app.

------------------------------------------------------
## Version 2: TBD

------------------------------------------------------
## Version 3: TBD

------------------------------------------------------

In each folder, there is a ReadMe.md file on how to run the scripts. 

Every script can be used independently.
