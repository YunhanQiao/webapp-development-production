# Git Branch Management Best Practices

## Overview
This document serves as a guide for managing branches in our Git repository effectively, ensuring smooth integration and deployment processes. Our primary branches are `staging` and `main`, with `staging` serving as an intermediary step before code reaches `main`, our deployment branch.

### Key Branches:
- **Staging Branch:** Contains the latest code for the next release.
- **Main Branch (Deployment Branch):** Contains the deployed and tested code.

## Workflow Steps

### 1. Cloning the Staging Branch
- Start by cloning the staging branch locally.
- This branch includes existing test cases to ensure compatibility with older code.

### 2. Running Old Test Cases
- Once cloned, run the old test cases locally to ensure no existing functionality is broken.

### 3. Adding New Test Cases
- Add your test cases corresponding to the new features or changes you are implementing.
- Ensure your tests cover both new functionalities and do not break existing ones.

### 4. Pushing Changes and Running Tests in CI
- Push your branch with added test cases to the remote repository.
- Upon pushing, GitHub Actions will automatically run both old and new test cases on your branch.
- Ensure all tests pass before proceeding to raise a Pull Request (PR).

### 5. Raising a Pull Request to Staging
- Once you confirm that all tests pass, raise a PR to merge your changes into the staging branch.
- The PR should be reviewed by peers for code quality and adherence to project standards.

### 6. Merging to Staging Branch
- After approval, merge your PR into the staging branch.
- The staging branch should always be in a deployable state with the latest changes.

### 7. End-of-Sprint Merge to Main Branch
- At the end of each sprint, the staging branch is merged into the main branch.
- This ensures the main branch has thoroughly tested and deployment-ready code.

## Best Practices

1. **Keep Your Branches Updated:** Regularly update your local branches with the latest changes from the remote staging and main branches.

2. **Focused Branches:** Each branch should represent a single logical feature or fix to maintain clarity and ease of tracking changes.

3. **Peer Reviews:** All PRs must be peer-reviewed to maintain code quality and prevent potential issues.

4. **Automated Testing:** Leverage automated testing in GitHub Actions to catch issues early and ensure reliability.

5. **Frequent Commits:** Make small, frequent commits with clear messages that provide context and rationale for the changes.

6. **Testing Locally:** Before pushing changes, ensure that all tests pass locally to avoid breaking the build on the remote repository.

7. **Documentation:** Update relevant documentation with any changes in functionality or usage.

8. **Conflict Resolution:** Resolve merge conflicts proactively by regularly syncing your branch with the target branch before raising a PR.

9. **Code Standards:** Adhere to the project's coding standards and guidelines for consistency and maintainability.

10. **Communication:** Keep the team informed about significant changes or updates in your branch that may impact others' work.


## CI Workflow 

Application is currently deployed on a single EC2 Instance for each environment. The CI/CD aims to reduce the manual deployment but is in no way mature and needs iterative improvement if the project scales in future. As its a single instance application, no autoscaling group is configured for this.

The CI triggers when the PR is merged to main and staging. Green tick means the deployment is successfull.


### ENV Variables

The CI needs 3 ENV variable ```EC2_HOST_UAT```, ```EC2_UAT_PRIVATE_KEY```, ```EC2_UAT_USER```
1. EC2_HOST_UAT - public ip of EC2 instance
2. EC2_UAT_PRIVATE_KEY - properly formatted private key attached to ec2(use pbcopy to copy)
3. EC2_UAT_USER - user name of your instance name, in this case it would be ```ubuntu```

### EC2 Instance startup and configuration

The AWS infrastructure state manangement is pure manual. To make infra management easy it is recommended to use Terraform or Ansible in future for better control. 
The CI is only functional as long as the EC2 instance is up and running and the environment variables have the corresponsing values of the instance.
NOTE: The react app does not deploy propely on AWS AMI, the current image used for deployment is ```Ubuntu``` and is recommended to be used in future as well.

In case the instance is terminiated or a new or upgraded instance is created for deployment do the following steps.

1. Add the startup script under workflow file with name ```ec2.sh``` in the user data while creating the instance for the first time. If you miss this step, simply ssh into the ec2 instance and run all the commands given in the script.

2. If the previous step is successful, add the ec2 information in the CI enviroment variables under project setting > security > secrets and variables > actions

3. Re-run the CI. A green tick means the CI is successful.

## Current deployment

Application is currently deployed at ```http://frontend.uat.speedscore.org/```

If the public ip of EC2 instance changes for any reason, edit the DNS subdomain in Route 53 to reflect the new IP. 


## Conclusion
Following these best practices will ensure a smooth and efficient workflow for managing our Git branches. It is crucial to maintain the integrity and stability of the staging and main branches, as they are key to our deployment pipeline. Let's collaborate effectively to achieve our development goals while maintaining high code quality.
