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

    mapping(address => uint256[]) ownersProjectsIds;
    mapping(address => Contribution[]) public contributions;

    Project[] public projects;

    event createdProject(
        address indexed owner,
        string title,
        uint256 fundingAmount,
        uint256 fundingGoal,
        address beneficiary,
        Status status
    );

    modifier isProjectOwner(uint256 _projectId) {
        uint256[] memory ownerProjectsIds = ownersProjectsIds[msg.sender];
        bool ownsProject = false;

        for (uint256 i = 0; i < ownerProjectsIds.length; i++) {
            uint256 currentId = ownerProjectsIds[i];
            if (currentId == _projectId) {
                ownsProject = true;
            }
        }
        require(
            ownsProject,
            "You do not own this project or this project does not exist"
        );
        _;
    }

    modifier isContributor(uint256 _projectId) {
        Contribution[] memory ownerContributions = contributions[msg.sender];
        bool madeContribution = false;

        for (uint256 i = 0; i < ownerContributions.length; i++) {
            Contribution memory currentContribution = ownerContributions[i];
            if (currentContribution.projectId == _projectId) {
                madeContribution = true;
            }
        }
        require(
            madeContribution,
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
            "Project has met it's funding goal"
        );
        require(block.timestamp <= endDate, "Project fund raising is over");
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
        ownersProjectsIds[msg.sender].push(projectId);

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
        contributions[msg.sender].push(newContribution);
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
        Contribution[] storage currentContributions = contributions[msg.sender];

        for (uint256 i = 0; i < currentContributions.length; i++) {
            Contribution storage currentContribution = currentContributions[i];

            if (currentContribution.projectId == _projectId) {
                uint256 amount = currentContribution.amountFunded;
                currentContribution.amountFunded = 0;
                currentProject.fundingAmount =
                    currentProject.fundingAmount -
                    amount;
                payable(msg.sender).transfer(amount);
            }
        }
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
