import { expect } from 'chai';

export default function hello() {
  it('Says hello :)', async () => {
    let helloResponse;
    try {
      helloResponse = await this.request
        .post('/')
        .send({
          query: `
            query hello {
              hello
            }
          `,
        })
        .then((response) => {
          console.log(response.body);
          return response;
        });
    } catch (error) {
      console.log(error);
    }
    expect(helloResponse.body.data.hello).to.equal('Hello!');
  });
}
