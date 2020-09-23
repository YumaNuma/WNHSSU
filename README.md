> ## :warning: Howdy! This is an old repo of mine, dated over 12 months ago last updated. Since then, it has not been updated package-wise and code wise.

# Event System for Stage Crews
  This system allows Crew Chief to create an event, allow Crew Members to sign up for events, and see an up-to-date list of events all from a mobile device or PC!
  
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/zaida04/WNSU?style=for-the-badge)![David](https://img.shields.io/david/zaida04/WNSU?style=for-the-badge)

[![DeepScan grade](https://deepscan.io/api/teams/7103/projects/9241/branches/117530/badge/grade.svg?style=for-the-badge)](https://deepscan.io/dashboard#view=project&tid=7103&pid=9241&bid=117530)

  The frontend is semi-mobile friendly, but all features 100% work on both mobile and PC.

  
  **IT IS DEPENDANT ON YOU TO SECURE THE SYSTEM IN A WAY THAT IS APPROPRIATE TO YOUR SCHOOL. ONLY "SECURITY" THIS THING HAS THAT I'VE UPLOADED TO GITHUB IS CAPTCHA, AND PASSWORD HASHES IN WHICH YOU MUST PROVIDE THE API KEYS FOR.**
  Future for this: might refactor it to seperate the backend and front end, right now the api is mixed with the frontend.
 
## How to Use:
```
git clone https://GitHub.com/zaida04/WNSU.git
cd WNSU
npm install
Node index.js
```
  - Configure port (Default is 80)
  - copy the config.json.example, rename it to config.json,
  - substitue the api keys for captcha and twilio in config.json 
  - Website should be hosted at http://127.0.0.1/
  - Create events at: http://127.0.0.1/admin/createevent
  - Event List at: http://127.0.0.1/events
  
  **DEFAULT PASSWORD FOR STAGE CHIEF/ADMIN IS 6456**

  
## Current Features:
  - Sign up for events
  - Create event (Crew Chief only)
  - See list of events (Sorted by Recently Added)
  - See details of events & displays who is working events
  - Automatically hides positions that are already signed up.
  - Delete event page (Crew Chief only)
  - Automatically rejects same person sign ups for multiple positions 
  - Automatically hides unneeded positions
  - Ability to unsign up for events
  - Waitlist
  - User Base
  - Notifies user through text on signup, event signup/unsignup, waitlist signup/unsignup, etc
  

## Backstory:
  I made this system cause I was going crazy not knowing what events there were or who was working them or if someone was already working them. So I just decided to make my own system and hopefully have it implemented into the stage crew. This was developed by me, Zaid, through tears and my last remaining brain cells right after finals week. This could use a bit of refactoring, which I will attempt my best to do. I welcome contributors cause I am far from perfect and anyone is welcome to download this and use it for their own school or whatever.


