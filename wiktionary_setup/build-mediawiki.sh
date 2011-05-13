#!/bin/bash
# This script creates a MediaWiki installation ready to run the template
# expander used by the Wiktionary parser.

################################################################################

# The MediaWiki database to create (leave password empty for prompt).
WIKI_DB_HOST=localhost
WIKI_DB_USER=root
WIKI_DB_PWD=
WIKI_DB_NAME=dictionary_lookup_mediawiki

# The Lookup (result) database to create (leave password empty for prompt).
LOOKUP_DB_HOST=localhost
LOOKUP_DB_USER=root
LOOKUP_DB_PWD=
LOOKUP_DB_NAME=dictionary

# The version of MediaWiki to use.
VERSION_MAJOR=1
VERSION_MINOR=15
VERSION_REVISION=2

################################################################################

# Stop on errors.
set -e
set -o pipefail

# Remove previous mediawiki folder.
rm -rf mediawiki

# Download and untar the main MediaWiki source.
wget http://dumps.wikimedia.org/mediawiki/$VERSION_MAJOR.$VERSION_MINOR/mediawiki-$VERSION_MAJOR.$VERSION_MINOR.$VERSION_REVISION.tar.gz -O mediawiki.tar.gz
tar -xf mediawiki.tar.gz
mv mediawiki-$VERSION_MAJOR.$VERSION_MINOR.$VERSION_REVISION mediawiki
rm mediawiki.tar.gz

# Checkout required extensions.
svn co http://svn.wikimedia.org/svnroot/mediawiki/tags/REL${VERSION_MAJOR}_${VERSION_MINOR}_${VERSION_REVISION}/extensions/ExpandTemplates mediawiki/extensions/ExpandTemplates
svn co http://svn.wikimedia.org/svnroot/mediawiki/tags/REL${VERSION_MAJOR}_${VERSION_MINOR}_${VERSION_REVISION}/extensions/ParserFunctions mediawiki/extensions/ParserFunctions

# Apply custom patches.
patch mediawiki/languages/Language.php < Language.patch
patch mediawiki/extensions/ExpandTemplates/ExpandTemplates_body.php < ExpandTemplates_body.patch

# Copy our default settings to the MediaWiki mediawiki
cp LocalSettings.php mediawiki

# Copy the template expander helper script into the MediaWiki mediawiki.
cp template_expander.php mediawiki

# Create the databases.
echo "DROP DATABASE IF EXISTS $WIKI_DB_NAME; CREATE DATABASE $WIKI_DB_NAME;" | mysql -h $WIKI_DB_HOST -u $WIKI_DB_USER -p $WIKI_DB_PWD
echo "DROP DATABASE IF EXISTS $LOOKUP_DB_NAME; CREATE DATABASE $LOOKUP_DB_NAME;" | mysql -h $LOOKUP_DB_HOST -u $LOOKUP_DB_USER -p $LOOKUP_DB_PWD

# Create the database tables.
mysql -h $WIKI_DB_HOST -u $WIKI_DB_USER -p $WIKI_DB_PWD $WIKI_DB_NAME < wiki.sql
mysql -h $LOOKUP_DB_HOST -u $LOOKUP_DB_USER -p $LOOKUP_DB_PWD $LOOKUP_DB_NAME < lookup.sql

# Done.
cat << EOF
--------------------------------------------------------------------------------
A MediaWiki installation has been created in the mediawiki folder. Please point
a PHP-enabled Apache server to the folder and update TEMPLATE_EXPANDER_URL in
wiktionary/__main__.py with the URL from which it is being served. You can also
update \$wgScriptPath and the database configuration of the server from
mediawiki/LocalSettings.php.
EOF
