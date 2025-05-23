export const login = async (username: string, password: string) => {
  const response = await fetch("https://localhost:7210/User/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ Email: username, Password: password }),
  });

  if (!response.ok) {
    throw new Error("Wrong login or password");
  }

  const token = await response.text();
  return token;
};

export const register = async (username: string, email: string, password: string) => {
  const response = await fetch("https://localhost:7210/User/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ UserName: username, Email: email, Password: password }),
  });

  if (response.status === 409) {
    const error = await response.json();
    throw new Error(error.message || "Такой email уже занят");
  }

  if (!response.ok) {
    throw new Error("Ошибка регистрации"); 
  }
};
