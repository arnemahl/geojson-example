export default {
    get: (url) => new Promise((resolve, reject) => {
        window.fetch(url, {
            method: 'GET',
            credentials: 'same-origin'
        }).then(
            response => {
                if (response.headers.get('content-type').includes('json')) {
                    return response.json().then(resolve, reject);
                } else {
                    resolve(response);
                }
            },
            error => {
                reject(error);
            }
        );
    }),
    post: (url, data = {}) => new Promise((resolve, reject) => {
        window.fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            body: JSON.stringify(data),
            headers: { 'content-type': 'application/json' }
        }).then(
            response => {
                if (response.status === 200) {
                    resolve(response);
                } else {
                    reject(Error(response));
                }
            },
            error => {
                reject(error);
            }
        );
    })
};

export const REQ = {
    INIT: Symbol('INIT'),
    PENDING: Symbol('PENDING'),
    ERROR: Symbol('ERROR'),
    SUCCESS: Symbol('SUCCESS')
};
