import os
import re

file_path = r"d:\Program_DEV\Academy_Management\frontend\src\main.js"

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple string replacements
    replacements = [
        ('< div', '<div'),
        ('< table', '<table'),
        ('< button', '<button'),
        ('< input', '<input'),
        ('< label', '<label'),
        ('< span', '<span'),
        ('< p', '<p'),
        ('< textarea', '<textarea'),
        ('< option', '<option'),
        ('</ div', '</div'),
        ('</ table', '</table'),
        ('</ button', '</button'),
        ('</ label', '</label'),
        ('</ span', '</span'),
        ('</ p', '</p'),
        ('</ textarea', '</textarea'),
        ('</ option', '</option'),
        ('data - index', 'data-index'),
        ('omr - ', 'omr-'),
        ('q - ', 'q-'),
        ('status - ', 'status-'),
        ('badge - ', 'badge-')
    ]

    for old, new in replacements:
        content = content.replace(old, new)

    # Regex replacements for more general cases
    # Fix start tags with space: < div -> <div
    content = re.sub(r'<\s+([a-zA-Z0-9-]+)', r'<\1', content)
    
    # Fix end tags with space: </ div -> </div
    content = re.sub(r'</\s+([a-zA-Z0-9-]+)', r'</\1', content)
    
    # Fix closing bracket with space:  > -> > (only if preceded by quote or alphanumeric)
    content = re.sub(r'(["\'\w])\s+>', r'\1>', content)
    
    # Fix attribute assignment with spaces: class = "foo" -> class="foo"
    content = re.sub(r'([a-zA-Z0-9-]+)\s+=\s+"', r'\1="', content)
    content = re.sub(r"([a-zA-Z0-9-]+)\s+=\s+'", r"\1='", content)

    # Fix specific template literal issues seen in view_file
    content = content.replace('${ ', '${')
    content = content.replace(' }', '}')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("File updated successfully.")

except Exception as e:
    print(f"Error: {e}")
