const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = ethers;

async function fastCrowdfunderDeployHelper() {
  const Crowdfunder = await ethers.getContractFactory("Crowdfunder");
  const crowdfunder = await Crowdfunder.deploy();
  await crowdfunder.deployed();
  return crowdfunder;
}

describe("Smart Contract: Crowdfunder", function () {
  it("Ensure the minimum balance is correct", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();

    const expectedMinContributionAmount = BigNumber.from("10000000000000000");
    const minContributionAmount = await crowdfunder.minContributionAmount();
    expect(minContributionAmount).to.equal(expectedMinContributionAmount);
  });

  it("Ensure a project can be created", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = 123;
    const bigNumberFundingGoal = BigNumber.from(fundingGoal);
    const activeStatus = 0;

    const tx = await crowdfunder
      .connect(projectCreator)
      .createProject(title, fundingGoal);

    await expect(tx)
      .to.emit(crowdfunder, "createdProject")
      .withArgs(
        projectCreator.address,
        title,
        0,
        bigNumberFundingGoal,
        projectCreator.address,
        activeStatus
      );
  });

  it("Ensure a created project has it's ID added to the list of projects", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = 123;
    const bigNumberFundingGoal = BigNumber.from(fundingGoal);
    const activeStatus = 0;
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    const project = await crowdfunder.projects(id);
    const returnedTitle = project["title"];
    const returnedFundingAmount = project["fundingAmount"];
    const returnedFundingGoal = project["fundingGoal"];
    const returnedBeneficiary = project["beneficiary"];
    const returnedStatus = project["status"];

    expect(returnedTitle).to.equal(title);
    expect(returnedFundingAmount).to.equal(0);
    expect(returnedFundingGoal).to.equal(bigNumberFundingGoal);
    expect(returnedBeneficiary).to.equal(projectCreator.address);
    expect(returnedStatus).to.equal(activeStatus);
  });

  it("Ensure that the project owner can archive a project", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = 123;
    const archivedStatus = 1;
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    await crowdfunder.connect(projectCreator).archiveAProject(id);

    const project = await crowdfunder.projects(id);
    const returnedStatus = project["status"];

    expect(returnedStatus).to.equal(archivedStatus);
  });

  it("Ensure that a project can only be archived by it's owner", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator, otherPerson] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = 123;
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    try {
      await crowdfunder.connect(otherPerson).archiveAProject(id);

      // Should fail if reaching the next assertion
      expect(true).to.be.false;
    } catch (error) {
      expect(error).to.match(
        /You do not own this project or this project does not exist/
      );
      expect(error).to.be.an.instanceof(Error);
    }
  });

  it("Ensure that a project can only be archived once", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = 123;
    const archivedStatus = 1;
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);
    await crowdfunder.connect(projectCreator).archiveAProject(id);
    const project = await crowdfunder.projects(id);
    const returnedStatus = project["status"];
    expect(returnedStatus).to.equal(archivedStatus);

    try {
      await crowdfunder.connect(projectCreator).archiveAProject(id);

      // Should fail if reaching the next assertion
      expect(true).to.be.false;
    } catch (error) {
      expect(error).to.match(/Project is archived/);
      expect(error).to.be.an.instanceof(Error);
    }
  });

  it("Ensure that a project can't be archived once done", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = 123;
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: BigNumber.from("200000000000000000"),
    });

    await crowdfunder.connect(projectCreator).withdrawFromAProject(id);

    try {
      await crowdfunder.connect(projectCreator).archiveAProject(id);

      // Should fail if reaching the next assertion
      expect(true).to.be.false;
    } catch (error) {
      expect(error).to.match(/Project is done/);
      expect(error).to.be.an.instanceof(Error);
    }
  });

  it("Ensure that a project owner can contribute to it's own project", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("200000000000000000");
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    const project = await crowdfunder.projects(id);
    const returnedFundingAmount = project["fundingAmount"];

    expect(returnedFundingAmount).to.eq(BigNumber.from(0));

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: contributionAmount,
    });

    const updatedProject = await crowdfunder.projects(id);
    const returnedUpdatedFundingAmount = updatedProject["fundingAmount"];

    expect(returnedUpdatedFundingAmount).to.eq(contributionAmount);
  });

  it("Ensure that anyone can contribute to a project", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator, otherPerson] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("200000000000000000");
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    const project = await crowdfunder.projects(id);
    const returnedFundingAmount = project["fundingAmount"];

    expect(returnedFundingAmount).to.eq(BigNumber.from(0));

    await crowdfunder.connect(otherPerson).contributeToProject(id, {
      value: contributionAmount,
    });

    const updatedProject = await crowdfunder.projects(id);
    const returnedUpdatedFundingAmount = updatedProject["fundingAmount"];

    expect(returnedUpdatedFundingAmount).to.eq(contributionAmount);
  });

  it("Ensure that contributions are tracked correctly across multiple contributions", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator, otherPerson] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const ownerContributionAmount = BigNumber.from("100000000000000000");
    const otherPersonContributionAmount = BigNumber.from("200000000000000000");
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: ownerContributionAmount,
    });

    await crowdfunder.connect(otherPerson).contributeToProject(id, {
      value: otherPersonContributionAmount,
    });

    const otherPersonContribution = await crowdfunder
      .connect(otherPerson)
      .contributions(otherPerson.address, 0);
    const ownerPersonContribution = await crowdfunder
      .connect(projectCreator)
      .contributions(projectCreator.address, 0);

    const returnedOtherPersonContribution =
      otherPersonContribution["amountFunded"];

    const returnedOwnerPersonContribution =
      ownerPersonContribution["amountFunded"];

    expect(returnedOtherPersonContribution).to.eq(
      otherPersonContributionAmount
    );

    expect(returnedOwnerPersonContribution).to.eq(ownerContributionAmount);
  });

  it("Ensure that a person can't contribute to a non active project", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("100000000000000000");
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    try {
      await crowdfunder.connect(projectCreator).archiveAProject(id);
      await crowdfunder.connect(projectCreator).contributeToProject(id, {
        value: contributionAmount,
      });

      // Should fail if reaching the next assertion
      expect(true).to.be.false;
    } catch (error) {
      expect(error).to.match(/Project is not active/);
      expect(error).to.be.an.instanceof(Error);
    }
  });

  it("Ensure that a person can't contribute to a project that has met it's funding goal ", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("400000000000000000");
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    try {
      await crowdfunder.connect(projectCreator).contributeToProject(id, {
        value: contributionAmount,
      });

      await crowdfunder.connect(projectCreator).contributeToProject(id, {
        value: contributionAmount,
      });

      // Should fail if reaching the next assertion
      expect(true).to.be.false;
    } catch (error) {
      expect(error).to.match(/Project has met its funding goal/);
      expect(error).to.be.an.instanceof(Error);
    }
  });

  it("Ensure that a person can't contribute to a project after the fund raising end date has past ", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("200000000000000000");
    const id = 0;
    const thirtyOneDaysInSeconds = 31 * 24 * 60 * 60;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    try {
      await crowdfunder.provider.send("evm_increaseTime", [
        thirtyOneDaysInSeconds,
      ]);
      await crowdfunder.connect(projectCreator).contributeToProject(id, {
        value: contributionAmount,
      });

      // Should fail if reaching the next assertion
      expect(true).to.be.false;
    } catch (error) {
      expect(error).to.match(/Project fundraising is over/);
      expect(error).to.be.an.instanceof(Error);
    }
  });

  it("Ensure that when a project is archived a refund can be processed", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "6000000000000000000";
    const contributionAmount = BigNumber.from("5000000000000000000");
    const archivedStatus = 1;
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    const startingBalance = await crowdfunder.provider.getBalance(
      projectCreator.address
    );

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: contributionAmount,
    });

    await crowdfunder.connect(projectCreator).archiveAProject(id);
    const project = await crowdfunder.projects(id);
    const returnedStatus = project["status"];
    expect(returnedStatus).to.equal(archivedStatus);

    const postContributionBalance = await crowdfunder.provider.getBalance(
      projectCreator.address
    );

    await crowdfunder.connect(projectCreator).refundFromAProject(id);

    const refundedBalance = await crowdfunder.provider.getBalance(
      projectCreator.address
    );

    expect(startingBalance.gt(postContributionBalance)).to.be.true;
    expect(postContributionBalance.lt(refundedBalance)).to.be.true;
  });

  it("Ensure that when a project has ended and has not reached it's goal a refund can be processed", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("200000000000000000");
    const id = 0;
    const thirtyOneDaysInSeconds = 31 * 24 * 60 * 60;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    const startingBalance = await crowdfunder.provider.getBalance(
      projectCreator.address
    );

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: contributionAmount,
    });

    const postContributionBalance = await crowdfunder.provider.getBalance(
      projectCreator.address
    );

    await crowdfunder.provider.send("evm_increaseTime", [
      thirtyOneDaysInSeconds,
    ]);

    await crowdfunder.connect(projectCreator).refundFromAProject(id);

    const refundedBalance = await crowdfunder.provider.getBalance(
      projectCreator.address
    );

    expect(startingBalance.gt(postContributionBalance)).to.be.true;
    expect(postContributionBalance.lt(refundedBalance)).to.be.true;
  });

  it("Ensure that a project refund can't be processed during active fund raising", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("200000000000000000");
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: contributionAmount,
    });

    try {
      await crowdfunder.connect(projectCreator).refundFromAProject(id);

      // Should fail if reaching the next assertion
      expect(true).to.be.false;
    } catch (error) {
      expect(error).to.match(/Project is not refundable at the moment/);
      expect(error).to.be.an.instanceof(Error);
    }
  });

  it("Ensure that a project refund can't be processed after the end date if the fund raising was successful", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("400000000000000000");
    const id = 0;
    const thirtyOneDaysInSeconds = 31 * 24 * 60 * 60;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: contributionAmount,
    });

    await crowdfunder.provider.send("evm_increaseTime", [
      thirtyOneDaysInSeconds,
    ]);

    try {
      await crowdfunder.connect(projectCreator).refundFromAProject(id);

      // Should fail if reaching the next assertion
      expect(true).to.be.false;
    } catch (error) {
      expect(error).to.match(/Project is not refundable at the moment/);
      expect(error).to.be.an.instanceof(Error);
    }
  });

  it("Ensure after a refund has processed both project and contribution amounts are adjusted", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("200000000000000000");
    const id = 0;
    const thirtyOneDaysInSeconds = 31 * 24 * 60 * 60;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: contributionAmount,
    });

    await crowdfunder.provider.send("evm_increaseTime", [
      thirtyOneDaysInSeconds,
    ]);

    const preRefundContribution = await crowdfunder
      .connect(projectCreator)
      .contributions(projectCreator.address, 0);
    const preRefundProject = await crowdfunder.projects(id);
    const preRefundFundingAmount = preRefundProject["fundingAmount"];

    await crowdfunder.connect(projectCreator).refundFromAProject(id);

    const postRefundContribution = await crowdfunder
      .connect(projectCreator)
      .contributions(projectCreator.address, 0);
    const postRefundProject = await crowdfunder.projects(id);
    const postRefundFundingAmount = postRefundProject["fundingAmount"];

    expect(preRefundContribution.amountFunded.eq(contributionAmount)).to.be
      .true;
    expect(postRefundContribution.amountFunded.isZero()).to.be.true;

    expect(preRefundFundingAmount.eq(contributionAmount)).to.be.true;
    expect(postRefundFundingAmount.isZero()).to.be.true;
  });

  it("Ensure a refund request will process multiple contributions for that project", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("100000000000000000");
    const id = 0;
    const thirtyOneDaysInSeconds = 31 * 24 * 60 * 60;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: contributionAmount,
    });

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: contributionAmount,
    });

    await crowdfunder.provider.send("evm_increaseTime", [
      thirtyOneDaysInSeconds,
    ]);

    const firstPreRefundContribution = await crowdfunder
      .connect(projectCreator)
      .contributions(projectCreator.address, 0);

    const secondPreRefundContribution = await crowdfunder
      .connect(projectCreator)
      .contributions(projectCreator.address, 0);

    await crowdfunder.connect(projectCreator).refundFromAProject(id);

    const firstPostRefundContribution = await crowdfunder
      .connect(projectCreator)
      .contributions(projectCreator.address, 0);

    const secondPostRefundContribution = await crowdfunder
      .connect(projectCreator)
      .contributions(projectCreator.address, 0);

    expect(firstPreRefundContribution.amountFunded.eq(contributionAmount)).to.be
      .true;
    expect(secondPreRefundContribution.amountFunded.eq(contributionAmount)).to
      .be.true;

    expect(firstPostRefundContribution.amountFunded.isZero()).to.be.true;
    expect(secondPostRefundContribution.amountFunded.isZero()).to.be.true;
  });

  it("Ensure the project owner/beneficiary can withdraw from a successful fund raising", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("5000000000000000000");
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: contributionAmount,
    });

    const preWithdrawProject = await crowdfunder.projects(id);
    const beneficiary = preWithdrawProject["beneficiary"];
    const beneficiaryBalance = await crowdfunder.provider.getBalance(
      beneficiary
    );

    await crowdfunder.connect(projectCreator).withdrawFromAProject(id);

    const withdrawnBeneficiaryBalance = await crowdfunder.provider.getBalance(
      beneficiary
    );

    expect(beneficiaryBalance.lt(withdrawnBeneficiaryBalance)).to.be.true;
  });

  it("Ensure a non-project owner can't withdraw someone elses project", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator, otherPerson] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("100000000000000000");
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: contributionAmount,
    });

    await crowdfunder.connect(otherPerson).contributeToProject(id, {
      value: contributionAmount,
    });

    try {
      await crowdfunder.connect(otherPerson).withdrawFromAProject(id);

      // Should fail if reaching the next assertion
      expect(true).to.be.false;
    } catch (error) {
      expect(error).to.match(
        /You do not own this project or this project does not exist/
      );
      expect(error).to.be.an.instanceof(Error);
    }
  });

  it("Ensure a project owner can't withdraw before funding met", async function () {
    const crowdfunder = await fastCrowdfunderDeployHelper();
    const [projectCreator] = await ethers.getSigners();

    const title = "Created A Project";
    const fundingGoal = "300000000000000000";
    const contributionAmount = BigNumber.from("100000000000000000");
    const id = 0;

    await crowdfunder.connect(projectCreator).createProject(title, fundingGoal);

    await crowdfunder.connect(projectCreator).contributeToProject(id, {
      value: contributionAmount,
    });

    try {
      await crowdfunder.connect(projectCreator).withdrawFromAProject(id);

      // Should fail if reaching the next assertion
      expect(true).to.be.false;
    } catch (error) {
      expect(error).to.match(/Project funding has not been met/);
      expect(error).to.be.an.instanceof(Error);
    }
  });
});
