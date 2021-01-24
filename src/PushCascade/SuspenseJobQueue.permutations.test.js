

describe("SuspenseJobQueue permutatons", () => {
  it('permutation 1', async () => {

    const jobQueue1 = new SuspenseJobQueue(() => 1);
    const jobQueue2 = jobQueue1.append((val) => val + 3);
    const jobQueue3 = jobQueue2.append((val) => val + 4);

    expect(jobQueue1.getJob()).toStrictEqual({
      value: 1,
      status: "success",
    });
    expect(jobQueue2.getJob()).toStrictEqual({
      value: 4,
      status: "success",
    });
    expect(jobQueue3.getJob()).toStrictEqual({
      value: 7,
      status: "success",
    });
  })
})