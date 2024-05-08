export const login = async (password: string) => {
    const data = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    }).then(res => res.json())
    if (!data.success) throw new Error(data.message)
    return data.data
}