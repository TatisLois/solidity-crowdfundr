// Crowdfundr Design Spec Interface

contract Crowdfundr {

  /// @dev startDate is Project creation & endDate is startDate + 30 days
  struct Project {
    string title;
    uint256 currentFundingAmount
    uint256 endDate
    uint256 fundingGoalAmount;
    uint256 startDate;
    bool status
  }

  struct Contribution {
    uint256 amountFunded;
    uint256 projectIndex;
  }

  /// @dev The owner address == beneficiary address
  // address owner public; not 1-many so does not make sense anymore
  // address payable beneficiary public; MOVED inside project struct
  // TODO: Ask for a better way to represent this?
  /// @dev minContributionAmount is 0.01 ETH.
  uint256 minContributionAmount public = 10000000000000000 wei;

  mapping(address => Project[]) public ownersProjects
  mapping(address => Contribution[]) public contributionToProjects;

  Project[] public projects;
 
  /// @dev configure the owner and beneficiary
  // constructor() {} Not needed if multiple owners

  modifier isOwner() {}

  // modifier isBeneficiary() {} may not need if moved in struct

  /// @dev Ensure the address is a contributor mapped to the project
  modifier isContributor(uint256 projectIndex) {}

  /// @dev Ensure a project is within the funding date range and the goal has not been reached
  modifier isProjectFundable(uint256 projectIndex) {}

  /// @dev Check if the project funding goal was a success
  // modifier isProjectSuccessful(uint256 projectIndex) {}  became isProjectFundingMet

  /// @dev Check if the project funding goal was a failure or if the project is cancled
  modifier isProjectAFailure(uint256 projectIndex) {}

  /// @dev create a project and set fundingGoalAmount
  function createProject(string memory _title, uint256 memory _fundingGoalAmount) public {}

  /// @dev Contribute to a valid project and checks amount paid is greater or equal to minContributionAmount
  function contributeToProject(uint256 projectIndex) public payable isProjectFundable {}

  /// @dev Widraw funds from a successful project
  function withdrawFromAProject(uint256 projectIndex) public isBeneficiary isProjectSuccessful {}

  /// @dev Refund funds from an unsuccessful project
  function refundFromAProject(uint256 projectIndex) public payable isContributor isProjectAFailure {}
  
  /// @dev Owner can cancel an active project
  function archiveAProject(uint256 projectIndex) public isOwner isProjectFundable {}

}