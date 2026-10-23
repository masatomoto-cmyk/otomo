import { useCallback, useEffect, useState } from 'react'

// 非同期データの取得。deps が変わると再取得し、reload() で手動再取得できる
export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  const reload = useCallback(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    run()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }))
    return () => {
      alive = false
    }
  }, [run])

  useEffect(() => reload(), [reload])
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) }
}
