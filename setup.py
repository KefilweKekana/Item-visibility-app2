from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in item_visibility/__init__.py
from item_visibility import __version__ as version

setup(
	name="item_visibility",
	version=version,
	description="Control item visibility per user in ERPNext",
	author="Your Company",
	author_email="your-email@example.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
