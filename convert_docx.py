import zipfile
import xml.etree.ElementTree as ET
import re
import sys
import os

def extract_text_from_docx(docx_path):
    """Извлекает текст из .docx файла"""
    try:
        with zipfile.ZipFile(docx_path, 'r') as zip_ref:
            xml_content = zip_ref.read('word/document.xml')
        
        # Парсим XML
        root = ET.fromstring(xml_content)
        
        # Namespace для Word XML
        namespaces = {
            'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
        }
        
        # Извлекаем весь текст
        text_elements = root.findall('.//w:t', namespaces)
        text = ''.join([elem.text for elem in text_elements if elem.text])
        
        return text
    except Exception as e:
        return f"Ошибка при извлечении текста: {str(e)}"

if __name__ == "__main__":
    base_path = r"f:\Мои Книги\Диамант Вилл\Доп.материалы"
    
    files = [
        ("Диамант Вилл_ Выбор (План Книги_ Синопсис).docx", "План_Синопсис.txt"),
        ("Диамант Вилл_ Глосарий.docx", "Глосарий.txt")
    ]
    
    for docx_file, output_file in files:
        docx_path = os.path.join(base_path, docx_file)
        output_path = os.path.join(base_path, output_file)
        
        print(f"Обрабатываю: {docx_file}")
        text = extract_text_from_docx(docx_path)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        
        print(f"Сохранено в: {output_file}")
        print(f"Длина текста: {len(text)} символов\n")
    
    print("Конвертация завершена!")
