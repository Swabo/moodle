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
 * Internal library of functions for module threedmodel
 *
 * All the threedmodel specific functions, needed to implement the module
 * logic, should go here. Never include this file from your lib.php!
 *
 * @package    mod_threedmodel
 * @copyright  2011 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();


/**
 * Display embedded resource file.
 * @param object $resource
 * @param object $cm
 * @param object $course
 * @param stored_file $file main file
 * @return does not return
 */
function threedmodel_display_embed($resource, $cm, $course, $file) {
    debugging('locallib.php: prüfe mich! (threedmodel_display_embed)');
    global $CFG, $PAGE, $OUTPUT;

    $clicktoopen = resource_get_clicktoopen($file, $resource->revision);

    $context = context_module::instance($cm->id);
    $path = '/'.$context->id.'/mod_resource/content/'.$resource->revision.$file->get_filepath().$file->get_filename();
    $fullurl = file_encode_url($CFG->wwwroot.'/pluginfile.php', $path, false);
    $moodleurl = new moodle_url('/pluginfile.php' . $path);

    $mimetype = $file->get_mimetype();
    $title    = $resource->name;

    $extension = resourcelib_get_extension($file->get_filename());

    $mediarenderer = $PAGE->get_renderer('core', 'media');
    $embedoptions = array(
        core_media::OPTION_TRUSTED => true,
        core_media::OPTION_BLOCK => true,
    );

    if (file_mimetype_in_typegroup($mimetype, 'web_image')) {  // It's an image
        $code = resourcelib_embed_image($fullurl, $title);

    } else if ($mimetype === 'application/pdf') {
        // PDF document
        $code = resourcelib_embed_pdf($fullurl, $title, $clicktoopen);

    } else if ($mediarenderer->can_embed_url($moodleurl, $embedoptions)) {
        // Media (audio/video) file.
        $code = $mediarenderer->embed_url($moodleurl, $title, 0, 0, $embedoptions);

    } else {
        // anything else - just try object tag enlarged as much as possible
        $code = resourcelib_embed_general($fullurl, $title, $clicktoopen, $mimetype);
    }

    resource_print_header($resource, $cm, $course);
    resource_print_heading($resource, $cm, $course);

    echo $code;

    resource_print_intro($resource, $cm, $course);

    echo $OUTPUT->footer();
    die;
}

function threedmodel_set_mainfile($data) {
    debugging('locallib.php: prüfe mich! (threedmodel_display_embed)');
    global $DB;
    $fs = get_file_storage();
    $cmid = $data->coursemodule;
    $draftitemid = $data->files;

    $context = context_module::instance($cmid);
    if ($draftitemid) {
        file_save_draft_area_files($draftitemid, $context->id, 'mod_threedmodel', 'content', 0, array('subdirs'=>true));
    }
    $files = $fs->get_area_files($context->id, 'mod_threedmodel', 'content', 0, 'sortorder', false);
    if (count($files) == 1) {
        // only one file attached, set it as main file automatically
        $file = reset($files);
        file_set_sortorder($context->id, 'mod_threedmodel', 'content', 0, $file->get_filepath(), $file->get_filename(), 1);
    }
}