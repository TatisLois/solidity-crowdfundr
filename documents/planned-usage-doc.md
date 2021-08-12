# Planned Usage

<!-- 1. Owner creates a contract
  1A. The account that creates the contract is the owner
  2B. The account that creates the contract is the beneficiary -->

2. Anyone can create a project(s)
  2A. A new project needs the owner to supply a title and funding goal amount
  2B. The start date will be the moment the project is created
  2C. The end date is 30+ days from the project creation time
  2D. Funding will default to 0
  2E. Status will default to active
  2f. The account that creates the contract is both the owner and beneficiary

3. Any address can pay (fund) any project
  3A. A check is made that the min contribution was sent
  3B. A check is made that the project is valid and able to accept funds
  3C. The project fundingGoalAmount is incremented by submission
  3D. Any other project values are updated if needed (status)
  3E. The contribution amount and project is stored
  3F. - If second or more contribution the contribution amount is incremented
  3. The contract receives and stores funds 

4. If project is a success the beneficiary can withdraw funds
  4A. A check is made on the project status and funding amount
  4B. Amount the project was holding is transferred

5. If project is a failure the contributors can withdraw funds
  5A. A check is made to ensure the address was a contributor to this project
  5B. A check is made on the project status or endDate as passed
  5C. Amount the contributor contributed to the project is transferred

6. An owner can cancel the project before it ends
  6A. A check is made to ensure the address is of the owner
  6B. A check is made that the project is valid and able to accept funds
  6C. Project status is updated (opening up refunds to be processed) 

