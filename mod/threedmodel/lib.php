<?php

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Library of interface functions and constants for module threedmodel
 *
 * All the core Moodle functions, neeeded to allow the module to work
 * integrated in Moodle should be placed here.
 * All the threedmodel specific functions, needed to implement all the module
 * logic, should go to locallib.php. This will help to save some memory when
 * Moodle is performing actions across all modules.
 *
 * @package    mod_threedmodel
 * @copyright  2011 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

/** example constant */
//define('threedmodel_ULTIMATE_ANSWER', 42);
////////////////////////////////////////////////////////////////////////////////
// Moodle core API                                                            //
////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the information on whether the module supports a feature
 *
 * @see plugin_supports() in lib/moodlelib.php
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed true if the feature is supported, null if unknown
 */
function threedmodel_supports($feature) {
    switch ($feature) {
        case FEATURE_MOD_INTRO: return true;
        case FEATURE_SHOW_DESCRIPTION: return true;

        default: return null;
    }
}

/**
 * Saves a new instance of the threedmodel into the database
 *
 * Given an object containing all the necessary data,
 * (defined by the form in mod_form.php) this function
 * will create a new instance and return the id number
 * of the new instance.
 *
 * @param object $threedmodel An object from the form in mod_form.php
 * @param mod_threedmodel_mod_form $mform
 * @return int The id of the newly inserted threedmodel record
 */
//function threedmodel_add_instance(stdClass $threedmodel, mod_threedmodel_mod_form $mform = null) {
//    global $DB;
//
//    $threedmodel->timecreated = time();
//
//    # You may have to add extra stuff in here #
//
//    return $DB->insert_record('threedmodel', $threedmodel);
//}

/**
 * Add resource instance.
 * @param object $data
 * @param object $mform
 * @return int new resource instance id
 */
function threedmodel_add_instance($data, $mform) {
    global $CFG, $DB;
    require_once("$CFG->libdir/resourcelib.php");
    require_once("$CFG->dirroot/mod/resource/locallib.php");
    $cmid = $data->coursemodule;
    $data->timemodified = time();
    $data->timecreated = time();
    //resource_set_display_options($data);

    $data->id = $DB->insert_record('threedmodel', $data);

    // we need to use context now, so we need to make sure all needed info is already in db
    $DB->set_field('course_modules', 'instance', $data->id, array('id' => $cmid));
    threedmodel_set_mainfile($data);
    return $data->id;
}

////////////////////////////////////////////////////////////////////////////////
// File API                                                                   //
////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the lists of all browsable file areas within the given module context
 *
 * The file area 'intro' for the activity introduction field is added automatically
 * by {@link file_browser::get_file_info_context_module()}
 *
 * @param stdClass $course
 * @param stdClass $cm
 * @param stdClass $context
 * @return array of [(string)filearea] => (string)description
 */
function threedmodel_get_file_areas($course, $cm, $context) {
    debugging('lib.php: schreibe mich!');
    return array();
}

/**
 * File browsing support for threedmodel file areas
 *
 * @package mod_threedmodel
 * @category files
 *
 * @param file_browser $browser
 * @param array $areas
 * @param stdClass $course
 * @param stdClass $cm
 * @param stdClass $context
 * @param string $filearea
 * @param int $itemid
 * @param string $filepath
 * @param string $filename
 * @return file_info instance or null if not found
 */
function threedmodel_get_file_info($browser, $areas, $course, $cm, $context, $filearea, $itemid, $filepath, $filename) {
    debugging('lib.php: schreibe mich!');
    return null;
}

/**
 * Serves the files from the threedmodel file areas
 *
 * @package mod_threedmodel
 * @category files
 *
 * @param stdClass $course the course object
 * @param stdClass $cm the course module object
 * @param stdClass $context the threedmodel's context
 * @param string $filearea the name of the file area
 * @param array $args extra arguments (itemid, path)
 * @param bool $forcedownload whether or not force download
 * @param array $options additional options affecting the file serving
 */
function threedmodel_pluginfile($course, $cm, $context, $filearea, array $args, $forcedownload, array $options = array()) {
    debugging('lib.php: schreibe mich!');
    global $DB, $CFG;

    if ($context->contextlevel != CONTEXT_MODULE) {
        send_file_not_found();
    }

    //  require_login($course, true, $cm);


    require_course_login($course, true, $cm);
    if (!has_capability('mod/threedmodel:view', $context)) {
        return false;
    }

    if ($filearea !== 'content') {
        // intro is handled automatically in pluginfile.php
        return false;
    }

  //  array_shift($args); // ignore revision - designed to prevent caching problems only

    $fs = get_file_storage();
    $relativepath = implode('/', $args);
    $fullpath = rtrim("/$context->id/mod_threedmodel/$filearea/0/$relativepath", '/');
    do {
        if (!$file = $fs->get_file_by_hash(sha1($fullpath))) {
            if ($fs->get_file_by_hash(sha1("$fullpath/."))) {
                if ($file = $fs->get_file_by_hash(sha1("$fullpath/index.htm"))) {
                    break;
                }
                if ($file = $fs->get_file_by_hash(sha1("$fullpath/index.html"))) {
                    break;
                }
                if ($file = $fs->get_file_by_hash(sha1("$fullpath/Default.htm"))) {
                    break;
                }
            }
//            $resource = $DB->get_record('threedmodel', array('id'=>$cm->instance), 'id, legacyfiles', MUST_EXIST);
//            if ($resource->legacyfiles != RESOURCELIB_LEGACYFILES_ACTIVE) {
//                return false;
//            }
//            if (!$file = resourcelib_try_file_migration('/'.$relativepath, $cm->id, $cm->course, 'mod_resource', 'content', 0)) {
//                return false;
//            }
//            // file migrate - update flag
//            $resource->legacyfileslast = time();
//            $DB->update_record('resource', $resource);
        }
    } while (false);

    // should we apply filters?
//    $mimetype = $file->get_mimetype();
//    if ($mimetype === 'text/html' or $mimetype === 'text/plain') {
//        $filter = $DB->get_field('resource', 'filterfiles', array('id'=>$cm->instance));
//        $CFG->embeddedsoforcelinktarget = true;
//    } else {
//        $filter = 0;
//    }
    $filter = 0;
    // finally send the file
    send_stored_file($file, null, $filter, $forcedownload, $options);
}
