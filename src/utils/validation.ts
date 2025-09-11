export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}

export class ValidationUtils {
  // Validación para nombres y apellidos (solo texto)
  static validateName(value: string, fieldName: string = 'Nombre'): ValidationResult {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        message: `${fieldName} es obligatorio`
      };
    }

    // Solo letras, espacios, tildes y eñe
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(value)) {
      return {
        isValid: false,
        message: `${fieldName} debe contener solo letras`
      };
    }

    if (value.trim().length < 2) {
      return {
        isValid: false,
        message: `${fieldName} debe tener al menos 2 caracteres`
      };
    }

    if (value.trim().length > 100) {
      return {
        isValid: false,
        message: `${fieldName} no puede tener más de 100 caracteres`
      };
    }

    return {
      isValid: true,
      message: ''
    };
  }

  // Validación para número de identificación (solo números)
  static validateIdentificationNumber(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        message: 'Número de identificación es obligatorio'
      };
    }

    // Solo números
    const numberRegex = /^\d+$/;
    if (!numberRegex.test(value)) {
      return {
        isValid: false,
        message: 'Número de identificación debe contener solo números'
      };
    }

    if (value.length < 6) {
      return {
        isValid: false,
        message: 'Número de identificación debe tener al menos 6 dígitos'
      };
    }

    if (value.length > 15) {
      return {
        isValid: false,
        message: 'Número de identificación no puede tener más de 15 dígitos'
      };
    }

    return {
      isValid: true,
      message: ''
    };
  }

  // Validación para email
  static validateEmail(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        message: 'Email es obligatorio'
      };
    }

    // Expresión regular para email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      return {
        isValid: false,
        message: 'Email debe tener un formato válido (ejemplo: usuario@dominio.com)'
      };
    }

    if (value.length > 254) {
      return {
        isValid: false,
        message: 'Email no puede tener más de 254 caracteres'
      };
    }

    return {
      isValid: true,
      message: ''
    };
  }

  // Validación para teléfono (solo números)
  static validatePhone(value: string, isRequired: boolean = false): ValidationResult {
    if (!value || value.trim() === '') {
      if (isRequired) {
        return {
          isValid: false,
          message: 'Teléfono es obligatorio'
        };
      }
      return {
        isValid: true,
        message: ''
      };
    }

    // Solo números
    const phoneRegex = /^\d+$/;
    if (!phoneRegex.test(value)) {
      return {
        isValid: false,
        message: 'Teléfono debe contener solo números'
      };
    }

    if (value.length < 7) {
      return {
        isValid: false,
        message: 'Teléfono debe tener al menos 7 dígitos'
      };
    }

    if (value.length > 15) {
      return {
        isValid: false,
        message: 'Teléfono no puede tener más de 15 dígitos'
      };
    }

    return {
      isValid: true,
      message: ''
    };
  }

  // Validación para campos de texto requeridos
  static validateRequired(value: string, fieldName: string): ValidationResult {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        message: `${fieldName} es obligatorio`
      };
    }

    return {
      isValid: true,
      message: ''
    };
  }

  // Validación para direcciones
  static validateAddress(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        message: 'Dirección es obligatoria'
      };
    }

    if (value.trim().length < 5) {
      return {
        isValid: false,
        message: 'Dirección debe tener al menos 5 caracteres'
      };
    }

    if (value.trim().length > 200) {
      return {
        isValid: false,
        message: 'Dirección no puede tener más de 200 caracteres'
      };
    }

    return {
      isValid: true,
      message: ''
    };
  }

  // Validación para metros cuadrados
  static validateSquareMeters(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        message: 'Metros cuadrados es obligatorio'
      };
    }

    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) {
      return {
        isValid: false,
        message: 'Metros cuadrados debe ser un número válido'
      };
    }

    if (numberValue <= 0) {
      return {
        isValid: false,
        message: 'Metros cuadrados debe ser mayor a 0'
      };
    }

    if (numberValue > 10000) {
      return {
        isValid: false,
        message: 'Metros cuadrados no puede ser mayor a 10,000'
      };
    }

    return {
      isValid: true,
      message: ''
    };
  }

  // Función para validar un formulario completo
  static validateForm(data: any, validationRules: { [key: string]: (value: any) => ValidationResult }): FormErrors {
    const errors: FormErrors = {};

    Object.keys(validationRules).forEach(field => {
      const validation = validationRules[field](data[field]);
      if (!validation.isValid) {
        errors[field] = validation.message;
      }
    });

    return errors;
  }

  // Función para verificar si hay errores
  static hasErrors(errors: FormErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  // Función para limpiar errores
  static clearErrors(): FormErrors {
    return {};
  }
}

// Hook personalizado para manejar validaciones en tiempo real
export const useFormValidation = (initialData: any, validationRules: { [key: string]: (value: any) => ValidationResult }) => {
  const [data, setData] = React.useState(initialData);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [touched, setTouched] = React.useState<{ [key: string]: boolean }>({});

  const validateField = (field: string, value: any) => {
    if (validationRules[field]) {
      const validation = validationRules[field](value);
      setErrors(prev => ({
        ...prev,
        [field]: validation.isValid ? '' : validation.message
      }));
    }
  };

  const handleChange = (field: string, value: any) => {
    setData((prev: any) => ({
      ...prev,
      [field]: value
    }));

    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
    validateField(field, data[field]);
  };

  const validateAll = () => {
    const newErrors = ValidationUtils.validateForm(data, validationRules);
    setErrors(newErrors);
    return !ValidationUtils.hasErrors(newErrors);
  };

  const resetForm = () => {
    setData(initialData);
    setErrors({});
    setTouched({});
  };

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetForm,
    hasErrors: ValidationUtils.hasErrors(errors)
  };
};

// Para importar React en el hook personalizado
import React from 'react';
