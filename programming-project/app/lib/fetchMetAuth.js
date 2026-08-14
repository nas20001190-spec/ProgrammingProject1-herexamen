export async function fetchMetAuth(url, opties = {}) {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1] || localStorage.getItem('token')

  const response = await fetch(url, {
    ...opties,
    headers: {
      ...opties.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  })

  if (response.status === 401 || response.status === 403) {
    document.cookie = 'token=; path=/; max-age=0'
    document.cookie = 'rol=; path=/; max-age=0'
    window.location.href = '/authentificator/login'
    return null
  }

  return response
}