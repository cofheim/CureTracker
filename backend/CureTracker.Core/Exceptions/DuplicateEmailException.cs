using System;

namespace CureTracker.Core.Exceptions
{
    public class DuplicateEmailException : Exception
    {
        public DuplicateEmailException(string email) 
            : base($"Пользователь с email {email} уже существует")
        {
            Email = email;
        }

        public string Email { get; }
    }
} 