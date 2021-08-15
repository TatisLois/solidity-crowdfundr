//SPDX-License-Identifier: Unlicense

pragma solidity >=0.7.0 <0.9.0;

contract Crowdfunder {
    struct Project {
        string title;
        uint256 fundingAmount;
        uint256 endDate;
        uint256 fundingGoal;
        uint256 startDate;
        address beneficiary;
        Status status;
    }

    struct Contribution {
        uint256 amountFunded;
        uint256 projectId;
    }

    enum Status {
        ACTIVE,
        ARCHIVED,
        FAILED,
        DONE
    }
    Status constant defaultChoice = Status.ACTIVE;

    uint256 public minContributionAmount = 10000000000000000 wei;

    mapping(address => mapping(uint256 => bool)) projectIdToOwner;
    mapping(address =>  mapping(uint256 => Contribution)) public projectContributionByOwner;

    Project[] public projects;

    event createdProject(
        address indexed owner,
        string title,
        uint256 fundingAmount,
        uint256 fundingGoal,
        address beneficiary,
        Status status
    );

    event sentContribution(
        address indexed owner,
        uint256 amountFunded,
        uint256 projectId
    );

    event refundProccessed(
        address indexed owner,
        uint256 amountRefunded,
        uint256 projectId
    );

    modifier isProjectOwner(uint256 _projectId) {
        bool ownsProject = projectIdToOwner[msg.sender][_projectId];
        require(
            ownsProject,
            "You do not own this project or this project does not exist"
        );
        _;
    }

    modifier isContributor(uint256 _projectId) {
        Contribution memory contribution = projectContributionByOwner[msg.sender][_projectId];
        uint amount = contribution.amountFunded;
        require(
            amount >= minContributionAmount,
            "You have not made a contribution to this project or this project does not exist"
        );
        _;
    }

    modifier isProjectFundable(uint256 _projectId) {
        Project memory currentProject = projects[_projectId];
        Status status = currentProject.status;
        uint256 endDate = currentProject.endDate;
        uint256 fundingAmount = currentProject.fundingAmount;
        uint256 fundingGoal = currentProject.fundingGoal;

        require(status == Status.ACTIVE, "Project is not active");
        require(
            fundingAmount < fundingGoal,
            "Project has met its funding goal"
        );
        require(block.timestamp <= endDate, "Project fundraising is over");
        _;
    }

    modifier isProjectFundingMet(uint256 _projectId) {
        Project memory currentProject = projects[_projectId];
        uint256 fundingAmount = currentProject.fundingAmount;
        uint256 fundingGoal = currentProject.fundingGoal;
        Status status = currentProject.status;

        require(status == Status.ACTIVE, "Project is not active");
        require(
            fundingAmount >= fundingGoal,
            "Project funding has not been met"
        );
        _;
    }

    modifier isProjectRefundable(uint256 _projectId) {
        Project memory currentProject = projects[_projectId];
        Status status = currentProject.status;
        uint256 fundingAmount = currentProject.fundingAmount;
        uint256 fundingGoal = currentProject.fundingGoal;
        uint256 endDate = currentProject.endDate;
        bool projectedArchived = uint256(status) == uint256(Status.ARCHIVED);
        bool fundingFailed = block.timestamp > endDate &&
            fundingAmount < fundingGoal &&
            status == Status.ACTIVE;

        require(
            projectedArchived || fundingFailed,
            "Project is not refundable at the moment"
        );
        _;
    }

    function isMyProject(uint256 _projectId) public view returns (bool) {
      return projectIdToOwner[msg.sender][_projectId];
    }

    function createProject(string memory _title, uint256 _fundingGoal) public {
        Project memory newProject = Project({
            title: _title,
            fundingAmount: 0,
            endDate: block.timestamp + 30 days,
            fundingGoal: _fundingGoal,
            startDate: block.timestamp,
            status: Status.ACTIVE,
            beneficiary: msg.sender
        });
        projects.push(newProject);
        uint256 projectId = projects.length - 1;
        projectIdToOwner[msg.sender][projectId] = true;

        emit createdProject(
            msg.sender,
            newProject.title,
            newProject.fundingAmount,
            newProject.fundingGoal,
            newProject.beneficiary,
            newProject.status
        );
    }

    function contributeToProject(uint256 _projectId)
        public
        payable
        isProjectFundable(_projectId)
    {
        require(
            msg.value >= minContributionAmount,
            "Did not meet the minimum contribution amount"
        );

        uint256 amount = msg.value;
        Contribution memory newContribution = Contribution({
            amountFunded: amount,
            projectId: _projectId
        });
        Project storage currentProject = projects[_projectId];
        currentProject.fundingAmount = currentProject.fundingAmount + amount;
        projectContributionByOwner[msg.sender][_projectId] = newContribution;

        emit sentContribution(
          msg.sender,
          amount,
          _projectId
        );
    }

    function withdrawFromAProject(uint256 _projectId)
        public
        isProjectOwner(_projectId)
        isProjectFundingMet(_projectId)
        returns (bool)
    {
        Project storage currentProject = projects[_projectId];
        currentProject.status = Status.DONE;
        uint256 amount = currentProject.fundingAmount;
        currentProject.fundingAmount = 0;
        payable(currentProject.beneficiary).transfer(amount);
        return true;
    }

    function refundFromAProject(uint256 _projectId)
        public
        payable
        isContributor(_projectId)
        isProjectRefundable(_projectId)
    {
        Project storage currentProject = projects[_projectId];
        Contribution storage contribution = projectContributionByOwner[msg.sender][_projectId];
        uint amount = contribution.amountFunded;
        contribution.amountFunded = 0;
        currentProject.fundingAmount = currentProject.fundingAmount - amount;
        (bool success, ) = msg.sender.call{value:amount}("");
        require(success, "Transfer failed.");

        emit refundProccessed(
          msg.sender,
          amount,
          contribution.projectId
        );
    }

    function archiveAProject(uint256 _projectId)
        public
        isProjectOwner(_projectId)
    {
        Project storage currentProject = projects[_projectId];
        require(
            uint256(currentProject.status) != uint256(Status.ARCHIVED),
            "Project is archived"
        );
        require(
            uint256(currentProject.status) != uint256(Status.FAILED),
            "Project has failed"
        );
        require(
            uint256(currentProject.status) != uint256(Status.DONE),
            "Project is done"
        );
        currentProject.status = Status.ARCHIVED;
    }
}
