import { put, putResolve, takeLatest, all } from 'redux-saga/effects'

function* apiCall({ payload }) {
  yield put({ type: 'START_API_CALL_' + payload.callType, payload })
  const returnedPayload = yield fetch(`` + payload.route, {
    method: payload.method || 'POST',
    headers: {
      'Content-Type': payload.contentType || 'application/json',
      Authorization: payload.token
    },
    body: payload.contentType === 'text/csv'
      ? payload.body
      : JSON.stringify(payload.body)
  })
    .then(res => res.json())
    .then(res => {
      if (!res.success) throw res
      return payload.getPayloadFromResult(res)
    })
    .catch(payload.onCatch || ((res, err) => console.log('sagaError', res, err)))

  yield putResolve({ type: payload.actionType, payload: returnedPayload })
  yield put({ type: 'END_API_CALL_' + payload.callType })
}

function* watchApiCall() {
  yield takeLatest('API_CALL', apiCall)
}

export default function* rootSaga() {
  yield all([
    watchApiCall()
  ])
}
